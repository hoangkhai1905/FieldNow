const bookingEvents = require('../events/booking.events');
const { bookingExpirationQueue, emailQueue } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');

const registerBookingListeners = () => {
  if (bookingEvents.listenerCount('BOOKING_CREATED') > 0) {
    return;
  }

  bookingEvents.on('BOOKING_CREATED', async ({ bookingId, slotId, userId }) => {
    try {
      await bookingExpirationQueue.add('booking.expire', {
        bookingId,
        slotId,
        expectedStatus: 'PENDING',
      }, { delay: 15 * 60 * 1000 });

      await emailQueue.add('email.booking_created', {
        userId,
        bookingId,
      });
    } catch (error) {
      logger.error({ err: error, bookingId }, '[BookingEvents] Failed to handle BOOKING_CREATED');
    }
  });

  bookingEvents.on('BOOKING_CANCELLED', async ({ bookingId, userId }) => {
    try {
      await emailQueue.add('email.booking_cancelled', {
        userId,
        bookingId,
      });
    } catch (error) {
      logger.error({ err: error, bookingId }, '[BookingEvents] Failed to handle BOOKING_CANCELLED');
    }
  });
};

module.exports = registerBookingListeners;
