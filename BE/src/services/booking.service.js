const prisma = require('../infrastructure/prisma');
const bookingRepository = require('../repositories/booking.repository');
const slotRepository = require('../repositories/slot.repository');
const { redisClient } = require('../infrastructure/redis');
const { bookingEventsQueue, bookingExpirationQueue, emailQueue } = require('../infrastructure/queue');
const { errors } = require('../utils/errors');
const { logger } = require('../infrastructure/logger');

/**
 * Creates a lock on a field/date/time range using Redis.
 */
const acquireBookingLock = async (fieldId, date, startTime, endTime, ttlMs = 10000) => {
  const lockKey = `lock:booking:${fieldId}:${date}:${startTime}:${endTime}`;
  const lockValue = Math.random().toString(36).substring(2, 15);
  const acquired = await redisClient.set(lockKey, lockValue, 'NX', 'PX', ttlMs);
  return acquired ? lockValue : null;
};

const releaseBookingLock = async (fieldId, date, startTime, endTime, lockValue) => {
  const lockKey = `lock:booking:${fieldId}:${date}:${startTime}:${endTime}`;
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redisClient.eval(script, 1, lockKey, lockValue);
};

const createBooking = async (userId, { fieldId, date, startTime, endTime }) => {
  // Normalize time to HH:mm
  const sTime = startTime.slice(0, 5);
  const eTime = endTime.slice(0, 5);

  // 1. Validate Time Range (06:00 - 22:00)
  const startH = parseInt(sTime.split(':')[0], 10);
  const endH = parseInt(eTime.split(':')[0], 10);
  const endM = parseInt(eTime.split(':')[1], 10);
  
  if (startH < 6 || endH > 22 || (endH === 22 && endM > 0)) {
    throw errors.validation('Thời gian đặt sân phải từ 06:00 đến 22:00');
  }

  if (sTime >= eTime) {
    throw errors.validation('Giờ kết thúc phải sau giờ bắt đầu');
  }

  // 2. Acquire Distributed Lock
  const lockValue = await acquireBookingLock(fieldId, date, sTime, eTime);
  if (!lockValue) {
    throw errors.conflict('Hệ thống đang xử lý yêu cầu đặt sân khác cho khung giờ này. Vui lòng thử lại sau.');
  }

  try {
    // 3. Transaction to check overlap and create booking
    const booking = await prisma.$transaction(async (tx) => {
      // Find the field
      const field = await tx.field.findUnique({ where: { id: fieldId } });
      if (!field) throw errors.notFound('Field');

      const reqStart = new Date(`1970-01-01T${sTime}:00Z`);
      const reqEnd = new Date(`1970-01-01T${eTime}:00Z`);

      // Check for overlaps with EXISTING CONFIRMED/PENDING bookings
      const overlappingSlots = await tx.fieldSlot.findMany({
        where: {
          field_id: fieldId,
          date: new Date(date),
          OR: [
            {
              AND: [
                { start_time: { lte: reqStart } },
                { end_time: { gt: reqStart } }
              ]
            },
            {
              AND: [
                { start_time: { lt: reqEnd } },
                { end_time: { gte: reqEnd } }
              ]
            },
            {
              AND: [
                { start_time: { gte: reqStart } },
                { end_time: { lte: reqEnd } }
              ]
            }
          ]
        },
        include: {
          bookings: {
            where: {
              status: { in: ['PENDING', 'CONFIRMED'] }
            }
          }
        }
      });

      const hasOverlap = overlappingSlots.some(s => s.bookings.length > 0);
      if (hasOverlap) {
        throw errors.conflict('Khung giờ này đã có người đặt hoặc bị trùng với lịch khác');
      }

      // Calculate price
      const durationHours = (reqEnd - reqStart) / (1000 * 60 * 60);
      const totalPrice = Number(field.price_per_hour) * durationHours;

      // Create Slot
      const slot = await tx.fieldSlot.create({
        data: {
          field_id: fieldId,
          date: new Date(date),
          start_time: reqStart,
          end_time: reqEnd,
          price_override: totalPrice
        }
      });

      // Create Booking
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      const newBooking = await bookingRepository.createBooking(userId, slot.id, expiresAt, tx);
      
      return { ...newBooking, slot };
    });

    // 4. Enqueue post-booking jobs
    await bookingExpirationQueue.add('booking.expire', {
      bookingId: booking.id,
      slotId: booking.slot_id,
      expectedStatus: 'PENDING',
    }, { delay: 15 * 60 * 1000 });

    await emailQueue.add('email.booking_created', {
      userId,
      bookingId: booking.id,
    });

    return booking;
  } finally {
    await releaseBookingLock(fieldId, date, sTime, eTime, lockValue);
  }
};

const getUserBookings = async (userId) => {
  return bookingRepository.findUserBookings(userId);
};

const getBookingById = async (bookingId, userId) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) {
    throw errors.notFound('Booking');
  }
  if (booking.user_id !== userId) {
    throw errors.forbidden('You do not own this booking');
  }
  return booking;
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

  await emailQueue.add('email.booking_cancelled', {
    userId,
    bookingId,
  });

  return updatedBooking;
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
};