const { Worker } = require('bullmq');
const { defaultQueueOptions, emailQueue } = require('../infrastructure/queue');
const prisma = require('../infrastructure/prisma');
const bookingRepository = require('../repositories/booking.repository');
const paymentRepository = require('../repositories/payment.repository');
const { logger } = require('../infrastructure/logger');

const processExpirationJob = async (job) => {
  const { bookingId, expectedStatus } = job.data;

  try {
    // Run in a transaction to ensure atomic check and update
    await prisma.$transaction(async (tx) => {
      const booking = await bookingRepository.findById(bookingId, tx);

      if (!booking) {
        logger.warn(`[Worker] Booking ${bookingId} not found for expiration check`);
        return;
      }

      // If status matches expected (usually PENDING) and expires_at is past
      // booking.payments is an array due to 1-n relation in schema
      // Check if ANY payment associated with this booking is 'cash'
      const isCash = booking.payments?.some(p => p.provider?.toLowerCase() === 'cash');
      
      logger.info(`[Worker] Checking expiration for Booking ${bookingId}. Status: ${booking.status}, isCash: ${isCash}, Providers: ${booking.payments?.map(p => p.provider).join(', ')}`);

      if (booking.status === expectedStatus && booking.expires_at <= new Date()) {
        if (isCash) {
          logger.info(`[Worker] Booking ${bookingId} has CASH payment, skipping auto-cancellation.`);
          return;
        }

        await bookingRepository.updateStatus(bookingId, 'CANCELLED', tx);
        await paymentRepository.expirePendingByBookingId(bookingId, tx);
        logger.info(`[Worker] Booking ${bookingId} expired and cancelled.`);

        // Enqueue cancellation email
        await emailQueue.add('email.booking_cancelled', {
          userId: booking.user_id,
          bookingId: booking.id,
          reason: 'Timeout (No payment received within 15 minutes)',
        });
      } else {
        logger.info(
          `[Worker] Booking ${bookingId} ignored for expiration (status: ${booking.status})`
        );
      }
    });
  } catch (error) {
    logger.error(`[Worker] Error processing expiration for booking ${bookingId}:`, error);
    throw error;
  }
};

const expirationWorker = new Worker(
  'booking-expiration',
  processExpirationJob,
  defaultQueueOptions
);

expirationWorker.on('completed', (job) => {
  logger.info(`[Worker] Job ${job.id} (booking-expiration) completed.`);
});

expirationWorker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job.id} (booking-expiration) failed:`, err);
});

module.exports = {
  expirationWorker,
  processExpirationJob, // Exported for testing
};
