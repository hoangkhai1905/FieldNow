const prisma = require('../infrastructure/prisma');
const bookingRepository = require('../repositories/booking.repository');
const fieldRepository = require('../repositories/field.repository');
const slotRepository = require('../repositories/slot.repository');
const bookingEvents = require('../events/booking.events');
const { redisClient } = require('../infrastructure/redis');
const { errors } = require('../utils/errors');
const Pipeline = require('../utils/pipeline');
const ValidateSlotStep = require('../pipelines/booking/validate-slot.step');
const AcquireLockStep = require('../pipelines/booking/acquire-lock.step');
const CheckAvailabilityStep = require('../pipelines/booking/check-availability.step');
const CreateBookingStep = require('../pipelines/booking/create-booking.step');
const EmitEventStep = require('../pipelines/booking/emit-event.step');

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

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
};
