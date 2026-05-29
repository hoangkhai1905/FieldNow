const prisma = require('../../infrastructure/prisma');
const paymentRepository = require('./payment.repository');
const bookingRepository = require('../bookings/booking.repository');
const config = require('../../config/index');
const { getPaymentProvider } = require('./providers/payment-factory');
const { errors } = require('../../common/utils/errors');
const { logger } = require('../../infrastructure/logger');
const { emailQueue } = require('../../infrastructure/queue');
const bookingSideEffects = require('../bookings/booking-side-effect.service');

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
    await bookingSideEffects.removeBookingExpirationJob(bookingId);
    await emailQueue.add('email.booking_confirmed', {
      userId: booking.user_id,
      bookingId,
    }, {
      jobId: `email-booking-confirmed-${bookingId}`,
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
    logger.warn('[SePay IPN] Missing booking ID in IPN payload. Attempting bank webhook fallback...');
    const fallbackResult = await confirmSepayBankWebhookByAmount(body, provider);
    if (fallbackResult) {
      return fallbackResult;
    }
    return { success: true };
  }

  // Validate if bookingId is a valid UUID
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  if (!uuidRegex.test(bookingId)) {
    logger.warn(`[SePay IPN] bookingId '${bookingId}' is not a valid UUID. Attempting fallback matching...`);

    const fallbackResult = await confirmSepayBankWebhookByAmount(body, provider);
    if (fallbackResult) {
      return fallbackResult;
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

const confirmSepayBankWebhookByAmount = async (body, provider) => {
  const amount = body?.transferAmount || body?.order?.order_amount;
  const isIncomingBankTransfer = body?.transferType === 'in' || body?.notification_type === 'ORDER_PAID';

  if (!amount || !isIncomingBankTransfer) {
    logger.warn('[SePay IPN] Fallback skipped: missing amount or unsupported transfer type');
    return null;
  }

  logger.info(`[SePay IPN] Attempting amount fallback for amount: ${amount}`);

  try {
    const recentThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        provider: { equals: 'sepay', mode: 'insensitive' },
        amount: Number(amount),
        created_at: { gte: recentThreshold },
        booking: { status: 'PENDING' },
      },
      include: { booking: true },
      orderBy: { created_at: 'desc' },
      take: 2,
    });

    if (pendingPayments.length !== 1) {
      logger.warn(`[SePay IPN] Amount fallback skipped: found ${pendingPayments.length} pending payments for amount ${amount}`);
      return null;
    }

    const fallbackId = pendingPayments[0].booking_id;
    logger.info(`[SePay IPN] Amount fallback matched booking ${fallbackId}. Confirming...`);
    await processPaymentCallback(fallbackId, provider.isSuccess(body), 'sepay');
    return { success: true, matched_by: 'amount_fallback' };
  } catch (error) {
    logger.error(`[SePay IPN] Amount fallback error: ${error.message}`);
    return null;
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
      if (['COMPLETED', 'FAILED', 'EXPIRED'].includes(latestPayment?.status)) {
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
        jobId: `email-booking-confirmed-${bookingId}`,
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

const confirmCashPayment = async (bookingId, actorId, { scope = 'admin' } = {}) => {
  return prisma.$transaction(async (tx) => {
    const booking = await bookingRepository.findById(bookingId, tx);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    if (scope === 'owner' && booking.field?.owner_id !== actorId) {
      throw errors.forbidden('You do not own this booking');
    }

    const payment = await paymentRepository.findLatestPendingByBookingId(bookingId, 'cash', tx);
    if (!payment) {
      const latestPayment = await paymentRepository.findByBookingId(bookingId, tx);
      if (latestPayment?.provider?.toLowerCase() === 'cash' && latestPayment.status === 'COMPLETED') {
        return latestPayment;
      }
      throw errors.notFound('Pending cash payment');
    }

    const updatedPayment = await paymentRepository.updateStatus(payment.id, 'COMPLETED', tx);
    logger.info({
      action: scope === 'owner' ? 'OWNER_CONFIRM_CASH_PAYMENT' : 'ADMIN_CONFIRM_CASH_PAYMENT',
      actorId,
      bookingId,
      paymentId: payment.id,
    }, '[Payment] Cash payment confirmed');
    return updatedPayment;
  });
};

module.exports = {
  initiatePayment,
  handleSepayIpn,
  getPaymentByBookingId,
  confirmCashPayment,
};
