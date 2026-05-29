const prisma = require('../../infrastructure/prisma');
const { buildPagination } = require('../../common/utils/pagination');

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
      field: {
        include: {
          owner: {
            select: {
              id: true,
              phone_number: true,
            },
          },
        },
      },
      slot: {
        include: {
          field: {
            include: {
              owner: {
                select: {
                  id: true,
                  phone_number: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

const findById = async (bookingId, tx = prisma) => {
  return tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      field: {
        include: {
          owner: {
            select: {
              id: true,
              phone_number: true,
            },
          },
        },
      },
      slot: {
        include: {
          field: {
            include: {
              owner: {
                select: {
                  id: true,
                  phone_number: true,
                },
              },
            },
          },
        },
      },
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

const findOverlappingActive = async (fieldId, date, startTime, endTime, tx = prisma) => {
  return tx.booking.findFirst({
    where: {
      field_id: fieldId,
      date: new Date(date),
      status: { in: ['PENDING', 'CONFIRMED'] },
      start_time: { lt: endTime },
      end_time: { gt: startTime },
    },
  });
};

const findUserBookings = async (userId, { page = 1, limit = 6, skip = 0, status } = {}) => {
  const where = { user_id: userId };
  if (['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        field: {
          include: {
            owner: {
              select: {
                id: true,
                phone_number: true,
              },
            },
          },
        },
        slot: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: buildPagination({ page, limit, total }),
  };
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

const findByOwnerFields = async (
  ownerId,
  { page = 1, limit = 10, skip = 0, status, fieldId, date } = {}
) => {
  const where = {
    field: {
      owner_id: ownerId,
    },
  };

  if (['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
    where.status = status;
  }

  if (fieldId) {
    where.field_id = fieldId;
  }

  if (date) {
    where.date = new Date(date);
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        field: {
          include: {
          owner: {
            select: {
              id: true,
              phone_number: true,
            },
          },
        },
        },
        user: {
          select: { full_name: true, phone_number: true, email: true },
        },
        slot: true,
        payments: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: buildPagination({ page, limit, total }),
  };
};

module.exports = {
  createBooking,
  findById,
  updateStatus,
  lockSlot,
  unlockSlot,
  checkActiveBookingsForSlot,
  findOverlappingActive,
  findActiveIntervals,
  findUserBookings,
  findByOwnerFields,
};
