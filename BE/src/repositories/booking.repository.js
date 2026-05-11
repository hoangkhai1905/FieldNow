const prisma = require('../infrastructure/prisma');

/**
 * Booking repository — encapsulates all Prisma queries for the Booking model.
 */

const createBooking = async ({
  userId,
  fieldId,
  slotId = null,
  date,
  startTime,
  endTime,
  totalPrice = 0,
  expiresAt,
}, tx = prisma) => {
  // Using an optional transaction object (tx) allows this to run inside a managed transaction
  return tx.booking.create({
    data: {
      user_id: userId,
      field_id: fieldId,
      slot_id: slotId,
      date,
      start_time: startTime,
      end_time: endTime,
      status: 'PENDING',
      total_price: totalPrice,
      expires_at: expiresAt,
    },
    include: {
      field: true,
      slot: true,
    },
  });
};

const findById = async (bookingId, tx = prisma) => {
  return tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      field: true,
      slot: true,
      user: true,
      payments: true,
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
      field: {
        select: { name: true, location: true },
      },
      slot: true,
    },
    orderBy: { created_at: 'desc' },
  });
};

const findActiveIntervals = async (fieldId, date, tx = prisma) => {
  const where = {
    field_id: fieldId,
    status: { in: ['PENDING', 'CONFIRMED'] },
  };

  if (date) {
    where.date = new Date(date);
  }

  return tx.booking.findMany({
    where,
    select: {
      id: true,
      date: true,
      start_time: true,
      end_time: true,
      slot_id: true,
      status: true,
    },
    orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
  });
};

module.exports = {
  createBooking,
  findById,
  updateStatus,
  lockSlot,
  unlockSlot,
  checkActiveBookingsForSlot,
  findActiveIntervals,
  findUserBookings,
};