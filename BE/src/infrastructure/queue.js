const { Queue } = require('bullmq');
const { buildRedisConnectionOptions } = require('./redis');

// Default queue options including connection and retries
const defaultQueueOptions = {
  connection: buildRedisConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// 1. booking-events: Handles immediate post-booking tasks (if any sync logic needs to be offloaded)
const bookingEventsQueue = new Queue('booking-events', defaultQueueOptions);

// 2. booking-expiration: Handles delayed jobs to cancel bookings if not paid in time
const bookingExpirationQueue = new Queue('booking-expiration', defaultQueueOptions);

// 3. notification-email: Handles email sending for various events
const emailQueue = new Queue('notification-email', defaultQueueOptions);

module.exports = {
  bookingEventsQueue,
  bookingExpirationQueue,
  emailQueue,
  defaultQueueOptions, // Exported for use in workers
};
