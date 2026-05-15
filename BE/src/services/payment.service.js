const prisma = require('../infrastructure/prisma');
const paymentRepository = require('../repositories/payment.repository');
const bookingRepository = require('../repositories/booking.repository');
const config = require('../config');
const { getPaymentProvider } = require('../providers/payment-factory');
const { errors } = require('../utils/errors');
const { logger } = require('../infrastructure/logger');
const { emailQueue } = require('../infrastructure/queue');

const initiatePayment = async (bookingId, userId, providerName = 'sepay') => {
  // 1. Get booking
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) {
    throw errors.notFound('Booking');
  }
  if (booking.user_id !== userId) {
    throw errors.forbidden('You do not own this booking');
  }
  if (booking.status !== 'PENDING') {
    throw errors.conflict('Booking is not in PENDING state');
  }

  // 2. Resolve Strategy
  const provider = getPaymentProvider(providerName);

  // 3. Check if a pending payment already exists
  let payment = await paymentRepository.findByBookingId(bookingId);
  const targetProvider = providerName.toLowerCase();

  const durationHours = (booking.end_time - booking.start_time) / (1000 * 60 * 60);
  const amount = booking.slot?.price_override != null
    ? Number(booking.slot.price_override)
    : Number(booking.field.price_per_hour) * durationHours;

  if (!payment) {
    // 4. Create payment record
    payment = await paymentRepository.createPayment(bookingId, amount, targetProvider);
  } else if (payment.status === 'FAILED') {
    payment = await paymentRepository.createPayment(bookingId, amount, targetProvider);
  } else if (payment.status !== 'PENDING') {
    throw errors.conflict(`Payment is already ${payment.status}`);
  } else if (payment.provider.toLowerCase() !== targetProvider) {
    logger.info(`[PaymentService] Changing provider from ${payment.provider} to ${targetProvider}`);
    payment = await paymentRepository.updateProvider(payment.id, targetProvider);
  }

  // 5. Cash bookings are confirmed immediately; payment is collected at the venue.
  if (targetProvider === 'cash') {
    await bookingRepository.updateStatus(bookingId, 'CONFIRMED');
    await emailQueue.add('email.booking_confirmed', {
      userId: booking.user_id,
      bookingId,
    }, {
      jobId: `email-booking-confirmed:${bookingId}`,
    });

    return {
      success: true,
      message: 'Đặt sân đã được xác nhận. Vui lòng thanh toán trực tiếp tại sân.',
      isDirect: true,
      status: 'CONFIRMED',
      paymentId: payment.id,
    };
  }

  // 6. Generate checkout URL + signed form fields for Online Providers
  const result = provider.createCheckoutFields(
    bookingId,
    amount,
    `${bookingId} - FieldNow Payment`,
  );

  return { ...result, paymentId: payment.id };
};

/**
 * Handle IPN (Instant Payment Notification) callback from SePay.
 * SePay POSTs JSON to this endpoint after every transaction.
 */
const handleSepayIpn = async (headers, body) => {
  const provider = getPaymentProvider('sepay');
  // 1. Verify secret key
  const isValidKey = provider.verifyIpn(headers, body);
  if (!isValidKey) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[Payment IPN] Invalid Secret Key, but allowing it because NODE_ENV=development');
    } else {
      throw errors.forbidden('Invalid payment IPN secret key');
    }
  }

  logger.info('[SePay IPN] --- START PROCESSING ---');
  logger.info(`[SePay IPN] Body: ${JSON.stringify(body, null, 2)}`);

  // 2. Extract booking ID and check success
  const bookingId = provider.extractBookingId(body);
  logger.info(`[SePay IPN] Extracted bookingId: ${bookingId}`);

  if (!bookingId) {
    logger.warn('[SePay IPN] Missing booking ID in IPN payload');
    return { success: true };
  }

  // Validate if bookingId is a valid UUID
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  if (!uuidRegex.test(bookingId)) {
    logger.warn(`[SePay IPN] bookingId '${bookingId}' is not a valid UUID. Attempting fallback matching...`);
    
    // FALLBACK FOR DEVELOPMENT: If no UUID found, try matching by amount
    if (process.env.NODE_ENV === 'development') {
      const amount = body?.transferAmount || body?.order?.order_amount;
      if (amount) {
        logger.info(`[SePay IPN] Attempting fallback matching for amount: ${amount}`);
        try {
          const pendingPayments = await prisma.payment.findMany({
            where: { 
              status: 'PENDING',
              amount: Number(amount)
            },
            include: { booking: true },
            orderBy: { created_at: 'desc' },
            take: 1 // Just take the most recent one for dev purposes
          });

          if (pendingPayments.length > 0 && pendingPayments[0].booking.status === 'PENDING') {
            const fallbackId = pendingPayments[0].booking_id;
            logger.info(`[SePay IPN] Fallback MATCH FOUND: ${fallbackId}. Confirming...`);
            await processPaymentCallback(fallbackId, provider.isSuccess(body), config.paymentProvider);
            return { success: true, matched_by: 'amount_fallback' };
          } else {
            logger.warn(`[SePay IPN] Fallback failed: found 0 pending payments for amount ${amount}`);
          }
        } catch (dbError) {
          logger.error(`[SePay IPN] Prisma query error in fallback: ${dbError.message}`);
        }
      }
    }
    
    return { success: true };
  }

  const isSuccess = provider.isSuccess(body);
  logger.info(`[SePay IPN] bookingId=${bookingId} | success=${isSuccess} | notification_type=${body?.notification_type}`);

  try {
    await processPaymentCallback(bookingId, isSuccess, config.paymentProvider);
    return { success: true };
  } catch (error) {
    if (error.code === 'CONFLICT' && error.message.includes('already')) {
      // Idempotent: payment already processed, still respond 200
      logger.warn(`[SePay IPN] Payment already processed for booking ${bookingId}`);
      return { success: true };
    }
    logger.error(`[SePay IPN] Error processing bookingId=${bookingId}: ${error.message}`);
    throw error;
  }
};

const processPaymentCallback = async (bookingId, isSuccess, provider) => {
  await prisma.$transaction(async (tx) => {
    const booking = await bookingRepository.findById(bookingId, tx);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    const payment = await paymentRepository.findLatestPendingByBookingId(bookingId, provider, tx);
    if (!payment) {
      const latestPayment = await paymentRepository.findByBookingId(bookingId, tx);
      if (latestPayment?.status === 'COMPLETED' || latestPayment?.status === 'FAILED') {
        throw errors.conflict(`Payment is already ${latestPayment.status}`);
      }
      throw errors.notFound('Pending payment');
    }

    if (isSuccess) {
      await paymentRepository.updateStatus(payment.id, 'COMPLETED', tx);
      await bookingRepository.updateStatus(bookingId, 'CONFIRMED', tx);

      logger.info(`[Payment] Booking ${bookingId} confirmed successfully via ${provider}`);

      await emailQueue.add('email.booking_confirmed', {
        userId: booking.user_id,
        bookingId: bookingId,
      }, {
        jobId: `email-booking-confirmed:${bookingId}`,
      });
    } else {
      // Keep booking PENDING so user can retry until expiration
      await paymentRepository.updateStatus(payment.id, 'FAILED', tx);
      logger.info(`[Payment] Booking ${bookingId} payment failed via ${provider}`);
    }
  });
};

const getPaymentByBookingId = async (bookingId, userId) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) {
    throw errors.notFound('Booking');
  }
  if (booking.user_id !== userId) {
    throw errors.forbidden('You do not own this booking');
  }

  const payment = await paymentRepository.findByBookingId(bookingId);
  if (!payment) {
    throw errors.notFound('Payment');
  }

  return payment;
};

module.exports = {
  initiatePayment,
  handleSepayIpn,
  getPaymentByBookingId,
};
