const prisma = require('../infrastructure/prisma');
const paymentRepository = require('../repositories/payment.repository');
const bookingRepository = require('../repositories/booking.repository');
const vnpayProvider = require('../providers/vnpay.provider');
const { errors } = require('../utils/errors');
const { logger } = require('../infrastructure/logger');
const { emailQueue } = require('../infrastructure/queue');

const initiatePayment = async (bookingId, userId, ipAddr) => {
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
    payment = await paymentRepository.createPayment(bookingId, amount, 'vnpay');
  } else if (payment.status !== 'PENDING') {
    throw errors.conflict(`Payment is already ${payment.status}`);
  }

  // 4. Generate URL
  const paymentUrl = vnpayProvider.createPaymentUrl(bookingId, amount, ipAddr, `Payment for booking ${bookingId}`);

  return { paymentUrl, paymentId: payment.id };
};

const handleVNPayReturn = async (vnpParams) => {
  const isValidSignature = vnpayProvider.verifySignature(Object.assign({}, vnpParams));
  if (!isValidSignature) {
    throw errors.validation('Invalid VNPay signature');
  }

  const bookingId = vnpParams['vnp_TxnRef'];
  const isSuccess = vnpayProvider.isSuccess(vnpParams);

  await processPaymentCallback(bookingId, isSuccess, 'vnpay');

  return { bookingId, isSuccess };
};

const handleVNPayIpn = async (vnpParams) => {
  const isValidSignature = vnpayProvider.verifySignature(Object.assign({}, vnpParams));
  if (!isValidSignature) {
    throw new Error('Invalid signature'); // For IPN, we just throw standard error
  }

  const bookingId = vnpParams['vnp_TxnRef'];
  const isSuccess = vnpayProvider.isSuccess(vnpParams);

  try {
    await processPaymentCallback(bookingId, isSuccess, 'vnpay');
    return { RspCode: '00', Message: 'Confirm Success' };
  } catch (error) {
    if (error.code === 'CONFLICT' && error.message.includes('already')) {
      // Idempotent success response for VNPay if already processed
      return { RspCode: '02', Message: 'Order already confirmed' }; 
    }
    logger.error(`[VNPay IPN] Error processing: ${error.message}`);
    return { RspCode: '99', Message: 'Unknown error' };
  }
};

const processPaymentCallback = async (bookingId, isSuccess, provider) => {
  await prisma.$transaction(async (tx) => {
    // Lock row (Optional, but using standard find for now. Prisma handles basic isolation)
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
      // Confirm Payment & Booking
      await paymentRepository.updateStatus(payment.id, 'COMPLETED', tx);
      await bookingRepository.updateStatus(bookingId, 'CONFIRMED', tx);
      
      logger.info(`[Payment] Booking ${bookingId} confirmed successfully via ${provider}`);
      
      await emailQueue.add('email.booking_confirmed', {
        userId: booking.user_id,
        bookingId: bookingId,
      });
    } else {
      // Fail Payment (Booking remains PENDING or can be CANCELLED based on product rules, we keep it PENDING to allow retry until expiration)
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
  handleVNPayReturn,
  handleVNPayIpn,
  getPaymentByBookingId,
};