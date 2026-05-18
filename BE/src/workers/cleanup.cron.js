const cron = require('node-cron');
const prisma = require('../infrastructure/prisma');
const { logger } = require('../infrastructure/logger');
const { emailQueue } = require('../infrastructure/queue');

/**
 * Sweeps stale pending bookings that might have been missed by BullMQ.
 * Runs every hour.
 */
const startCleanupCron = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('[Cron] Starting stale booking cleanup...');
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Find all PENDING bookings that expired more than 15 minutes ago
      const staleBookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING',
          expires_at: { lt: fifteenMinutesAgo },
          // Exclude bookings that have a 'cash' payment provider
          payments: {
            none: {
              provider: {
                equals: 'cash',
                mode: 'insensitive',
              },
            },
          },
        },
      });

      if (staleBookings.length === 0) {
        logger.info('[Cron] No stale bookings found.');
        return;
      }

      logger.info(`[Cron] Found ${staleBookings.length} stale bookings. Cancelling...`);

      const staleBookingIds = staleBookings.map((b) => b.id);

      await prisma.$transaction([
        prisma.booking.updateMany({
          where: {
            id: { in: staleBookingIds },
          },
          data: {
            status: 'CANCELLED',
          },
        }),
        prisma.payment.updateMany({
          where: {
            booking_id: { in: staleBookingIds },
            status: 'PENDING',
          },
          data: {
            status: 'EXPIRED',
          },
        }),
      ]);

      // Send emails
      for (const booking of staleBookings) {
        await emailQueue.add('email.booking_cancelled', {
          userId: booking.user_id,
          bookingId: booking.id,
          reason: 'Timeout (Cron fallback cleanup)',
        });
      }

      logger.info('[Cron] Stale booking cleanup completed successfully.');
    } catch (error) {
      logger.error('[Cron] Error during stale booking cleanup:', error);
    }
  });
  logger.info('[Cron] Stale booking cleanup job scheduled.');
};

module.exports = {
  startCleanupCron,
};
