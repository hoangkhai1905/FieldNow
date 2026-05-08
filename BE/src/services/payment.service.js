const prisma = require('../infrastructure/prisma');
const paymentRepository = require('../repositories/payment.repository');
const bookingRepository = require('../repositories/booking.repository');
const sepayProvider = require('../providers/sepay.provider');
const { errors } = require('../utils/errors');
const { logger } = require('../infrastructure/logger');
const { emailQueue } = require('../infrastructure/queue');

const initiatePayment = async (bookingId, userId) => {
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

  // 2. Check if a pending payment already exists
  let payment = await paymentRepository.findByBookingId(bookingId);

  // Calculate amount from slot priceOverride or field price
  const amount = booking.slot.price_override || booking.slot.field.price_per_hour;

  if (!payment) {
    // 3. Create payment record
    payment = await paymentRepository.createPayment(bookingId, amount, 'sepay');
  } else if (payment.status !== 'PENDING') {
    throw errors.conflict(`Payment is already ${payment.status}`);
  }

  // 4. Generate SePay checkout URL + signed form fields
  const { checkoutUrl, formFields } = sepayProvider.createCheckoutFields(
    bookingId,
    amount,
    `Payment for booking ${bookingId}`,
  );

  return { checkoutUrl, formFields, paymentId: payment.id };
};

/**
 * Handle IPN (Instant Payment Notification) callback from SePay.
 * SePay POSTs JSON to this endpoint after every transaction.
 */
const handleSepayIpn = async (headers, body) => {
  // 1. Verify secret key
  const isValidKey = sepayProvider.verifyIpn(headers);
  if (!isValidKey) {
    throw errors.forbidden('Invalid SePay IPN secret key');
  }

  logger.info('--- Received IPN Body ---');
  console.log(JSON.stringify(body, null, 2));

  // If this is a test notification from SePay dashboard, respond success early
  if (body?.notification_type === 'TEST' || body?.order?.order_invoice_number === 'test') {
    logger.info('[SePay IPN] Received TEST notification from SePay dashboard');
    return { success: true };
  }

  // 2. Extract booking ID and check success
  const bookingId = sepayProvider.extractBookingId(body);
  if (!bookingId) {
    throw errors.validation('Missing order_invoice_number in IPN payload');
  }

  // Validate if bookingId is a valid UUID (Prisma crashes if it's not)
  // The SePay simulator sends things like "DH046183932" which are not UUIDs
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(bookingId)) {
    logger.warn(`[SePay IPN] Ignoring webhook: extracted bookingId '${bookingId}' is not a valid UUID (likely a test)`);
    return { success: true };
  }

  const isSuccess = sepayProvider.isSuccess(body);
  logger.info(`[SePay IPN] bookingId=${bookingId} success=${isSuccess} type=${body?.notification_type}`);

  try {
    await processPaymentCallback(bookingId, isSuccess, 'sepay');
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

    const payment = await paymentRepository.findByBookingId(bookingId, tx);
    if (!payment) {
      throw errors.notFound('Payment');
    }

    // Idempotency check
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      throw errors.conflict(`Payment is already ${payment.status}`);
    }

    if (isSuccess) {
      await paymentRepository.updateStatus(payment.id, 'COMPLETED', tx);
      await bookingRepository.updateStatus(bookingId, 'CONFIRMED', tx);

      logger.info(`[Payment] Booking ${bookingId} confirmed successfully via ${provider}`);

      await emailQueue.add('email.booking_confirmed', {
        userId: booking.user_id,
        bookingId: bookingId,
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