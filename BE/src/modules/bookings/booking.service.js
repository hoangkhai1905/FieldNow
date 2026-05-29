const prisma = require('../../infrastructure/prisma');
const bookingRepository = require('./booking.repository');
const fieldRepository = require('../fields/field.repository');
const slotRepository = require('../slots/slot.repository');
const bookingEvents = require('../../common/events/booking.events');
const bookingSideEffects = require('./booking-side-effect.service');
const { redisClient } = require('../../infrastructure/redis');
const { logger } = require('../../infrastructure/logger');
const { errors } = require('../../common/utils/errors');
const Pipeline = require('../../common/utils/pipeline');
const ValidateSlotStep = require('./pipeline/validate-slot.step');
const AcquireLockStep = require('./pipeline/acquire-lock.step');
const CheckAvailabilityStep = require('./pipeline/check-availability.step');
const CreateBookingStep = require('./pipeline/create-booking.step');
const EmitEventStep = require('./pipeline/emit-event.step');

/**
 * Creates a lock on a field/date/time range using Redis.
 */
const acquireBookingLock = async (fieldId, date, ttlMs = 10000) => {
  const lockKey = `lock:field:${fieldId}:date:${date}`;
  const lockValue = Math.random().toString(36).substring(2, 15);
  const acquired = await redisClient.set(lockKey, lockValue, 'NX', 'PX', ttlMs);
  return acquired ? lockValue : null;
};

const releaseBookingLock = async (fieldId, date, lockValue) => {
  const lockKey = `lock:field:${fieldId}:date:${date}`;
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redisClient.eval(script, 1, lockKey, lockValue);
};

const normalizeBookingSlot = (booking) => {
  if (!booking) return booking;

  const slotField = booking.slot?.field ?? booking.field ?? null;
  if (booking.slot) {
    if (booking.slot.field) return booking;
    return { ...booking, slot: { ...booking.slot, field: slotField } };
  }

  return {
    ...booking,
    slot: {
      id: null,
      field_id: booking.field_id,
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      price_override: null,
      field: slotField,
    },
  };
};

const createBooking = async (userId, { fieldId, date, startTime, endTime }) => {
  const pipeline = new Pipeline()
    .use(new ValidateSlotStep())
    .use(new AcquireLockStep())
    .use(new CheckAvailabilityStep())
    .use(new CreateBookingStep())
    .use(new EmitEventStep());

  return pipeline.execute({
    userId,
    fieldId,
    date,
    startTime,
    endTime,
    prisma,
    bookingRepository,
    fieldRepository,
    slotRepository,
    bookingEvents,
    bookingSideEffects,
    logger,
    errors,
    acquireBookingLock,
    releaseBookingLock,
    normalizeBookingSlot,
    cleanup: [],
  });
};

const getUserBookings = async (userId, filters) => {
  const result = await bookingRepository.findUserBookings(userId, filters);
  return {
    bookings: result.bookings.map((booking) => normalizeBookingSlot(booking)),
    pagination: result.pagination,
  };
};

const getBookingById = async (bookingId, userId) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) {
    throw errors.notFound('Booking');
  }
  if (booking.user_id !== userId) {
    throw errors.forbidden('You do not own this booking');
  }
  return normalizeBookingSlot(booking);
};

const cancelBooking = async (bookingId, userId) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) {
    throw errors.notFound('Booking');
  }
  if (booking.user_id !== userId) {
    throw errors.forbidden('You do not own this booking');
  }
  if (booking.status !== 'PENDING') {
    throw errors.conflict(`Cannot cancel a booking with status ${booking.status}`);
  }

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const updated = await bookingRepository.updateStatus(bookingId, 'CANCELLED', tx);
    await tx.payment.updateMany({
      where: {
        booking_id: bookingId,
        status: 'PENDING',
      },
      data: { status: 'FAILED' },
    });
    return updated;
  });

  bookingEvents.emit('BOOKING_CANCELLED', {
    bookingId,
    userId,
  });

  return updatedBooking;
};

const rejectOwnerBooking = async (bookingId, ownerId) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) {
    throw errors.notFound('Booking');
  }
  if (booking.field?.owner_id !== ownerId) {
    throw errors.forbidden('You do not own this booking');
  }
  if (booking.status === 'CANCELLED') {
    throw errors.conflict('Booking is already cancelled');
  }
  if (booking.payments?.some((payment) => payment.status === 'COMPLETED')) {
    throw errors.conflict('Cannot reject a booking with completed payment');
  }

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const updated = await bookingRepository.updateStatus(bookingId, 'CANCELLED', tx);
    await tx.payment.updateMany({
      where: {
        booking_id: bookingId,
        status: 'PENDING',
      },
      data: { status: 'FAILED' },
    });
    return updated;
  });

  await bookingSideEffects.removeBookingExpirationJob(bookingId);
  await bookingSideEffects.scheduleBookingCancelledSideEffects({
    bookingId,
    userId: booking.user_id,
  });

  return updatedBooking;
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rejectOwnerBooking,
};
