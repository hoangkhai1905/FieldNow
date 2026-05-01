const prisma = require('../infrastructure/prisma');

/**
 * Booking repository — encapsulates all Prisma queries for the Booking model.
 */

const createBooking = async (userId, slotId, expiresAt, tx = prisma) => {
  // Using an optional transaction object (tx) allows this to run inside a managed transaction
  return tx.booking.create({
    data: {
      user_id: userId,
      slot_id: slotId,
      status: 'PENDING',
      expires_at: expiresAt,
    },
    include: {
      slot: {
        include: {
          field: true,
        },
      },
    },
  });
};

const findById = async (bookingId, tx = prisma) => {
  return tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      slot: {
        include: {
          field: true,
        },
      },
      user: true,
    },
  });
};

const updateStatus = async (bookingId, status, tx = prisma) => {
  return tx.booking.update({
    where: { id: bookingId },
    data: { status },
  });
};

const lockSlot = async (slotId, tx = prisma) => {
  // Optional: Update the slot lock status to prevent further bookings explicitly
  return tx.fieldSlot.update({
    where: { id: slotId },
    data: { is_locked: true },
  });
};

const unlockSlot = async (slotId, tx = prisma) => {
  return tx.fieldSlot.update({
    where: { id: slotId },
    data: { is_locked: false },
  });
};

const checkActiveBookingsForSlot = async (slotId, tx = prisma) => {
  const activeStatuses = ['PENDING', 'CONFIRMED'];
  return tx.booking.findFirst({
    where: {
      slot_id: slotId,
      status: { in: activeStatuses },
    },
  });
};

const findUserBookings = async (userId) => {
  return prisma.booking.findMany({
    where: { user_id: userId },
    include: {
      slot: {
        include: {
          field: {
            select: { name: true, location: true },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
};

module.exports = {
  createBooking,
  findById,
  updateStatus,
  lockSlot,
  unlockSlot,
  checkActiveBookingsForSlot,
  findUserBookings,
};