const { bookingExpirationQueue, emailQueue } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');

const scheduleBookingCreatedSideEffects = async ({ bookingId, slotId, delayMs }) => {
  await bookingExpirationQueue.add('booking.expire', {
    bookingId,
    slotId,
    expectedStatus: 'PENDING',
  }, {
    delay: Math.max(0, delayMs ?? 15 * 60 * 1000),
    jobId: `booking-expire-${bookingId}`,
  });

  logger.info({ bookingId }, '[BookingSideEffects] Scheduled booking expiration job');
};

const scheduleBookingCancelledSideEffects = async ({ bookingId, userId }) => {
  await emailQueue.add('email.booking_cancelled', {
    userId,
    bookingId,
  }, {
    jobId: `email-booking-cancelled-${bookingId}`,
  });

  logger.info({ bookingId }, '[BookingSideEffects] Scheduled booking cancelled email job');
};

const removeBookingExpirationJob = async (bookingId) => {
  const job = await bookingExpirationQueue.getJob(`booking-expire-${bookingId}`);
  if (!job) {
    return false;
  }

  await job.remove();
  logger.info({ bookingId }, '[BookingSideEffects] Removed booking expiration job');
  return true;
};

module.exports = {
  scheduleBookingCreatedSideEffects,
  scheduleBookingCancelledSideEffects,
  removeBookingExpirationJob,
};
