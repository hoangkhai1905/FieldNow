const prisma = require('../infrastructure/prisma');
const bookingRepository = require('../repositories/booking.repository');
const slotRepository = require('../repositories/slot.repository');
const { redisClient } = require('../infrastructure/redis');
const { bookingEventsQueue, bookingExpirationQueue, emailQueue } = require('../infrastructure/queue');
const { errors } = require('../utils/errors');
const { logger } = require('../infrastructure/logger');

/**
 * Creates a lock on a slot using Redis SET NX PX.
 */
const acquireLock = async (slotId, ttlMs = 5000) => {
  const lockKey = `lock:slot:${slotId}`;
  const lockValue = Math.random().toString(36).substring(2, 15);
  // NX: Only set if it does not exist
  // PX: Expiration time in ms
  const acquired = await redisClient.set(lockKey, lockValue, 'NX', 'PX', ttlMs);
  return acquired ? lockValue : null;
};

/**
 * Releases the Redis lock safely using a Lua script to ensure we only delete our own lock.
 */
const releaseLock = async (slotId, lockValue) => {
  const lockKey = `lock:slot:${slotId}`;
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redisClient.eval(script, 1, lockKey, lockValue);
};

const createBooking = async (userId, slotId) => {
  // 1. Validate slot existence and state
  const slot = await slotRepository.findById(slotId);
  if (!slot) {
    throw errors.notFound('Slot');
  }
  if (slot.is_locked) {
    throw errors.conflict('Slot is administratively locked');
  }

  // 2. Distributed Lock via Redis (Prevent concurrent requests for the same slot)
  const lockValue = await acquireLock(slotId);
  if (!lockValue) {
    throw errors.conflict('Slot is currently being booked by another user. Please try again later.');
  }

  try {
    // 3. Database transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Re-verify no active booking exists for this slot
      const existingActive = await bookingRepository.checkActiveBookingsForSlot(slotId, tx);
      if (existingActive) {
        throw errors.conflict('Slot has already been booked');
      }

      // Expires in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Create booking
      const newBooking = await bookingRepository.createBooking(userId, slotId, expiresAt, tx);
      return newBooking;
    });

    // 4. Enqueue post-booking jobs
    // Delay 15 minutes to check expiration
    await bookingExpirationQueue.add(
      'booking.expire',
      {
        bookingId: booking.id,
        slotId: booking.slot_id,
        expectedStatus: 'PENDING',
      },
      { delay: 15 * 60 * 1000 }
    );

    // Enqueue event
    await bookingEventsQueue.add('booking.created', {
      bookingId: booking.id,
      userId: booking.user_id,
      slotId: booking.slot_id,
      createdAt: booking.created_at,
    });

    // Add email job (fire and forget)
    await emailQueue.add('email.booking_created', {
      userId,
      bookingId: booking.id,
    });

    return booking;
  } finally {
    // 5. Always release the lock
    await releaseLock(slotId, lockValue);
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

  const updatedBooking = await bookingRepository.updateStatus(bookingId, 'CANCELLED');

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