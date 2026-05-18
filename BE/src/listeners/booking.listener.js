const bookingEvents = require('../events/booking.events');
const bookingSideEffects = require('../services/booking-side-effect.service');
const { logger } = require('../infrastructure/logger');

const registerBookingListeners = () => {
  if (bookingEvents.listenerCount('BOOKING_CREATED') > 0) {
    return;
  }

  bookingEvents.on('BOOKING_CREATED', async ({ bookingId, slotId, userId }) => {
    try {
      await bookingSideEffects.scheduleBookingCreatedSideEffects({ bookingId, slotId, userId });
    } catch (error) {
      logger.error({ err: error, bookingId }, '[BookingEvents] Failed to handle BOOKING_CREATED');
    }
  });

  bookingEvents.on('BOOKING_CANCELLED', async ({ bookingId, userId }) => {
    try {
      await bookingSideEffects.scheduleBookingCancelledSideEffects({ bookingId, userId });
    } catch (error) {
      logger.error({ err: error, bookingId }, '[BookingEvents] Failed to handle BOOKING_CANCELLED');
    }
  });
};

module.exports = registerBookingListeners;
