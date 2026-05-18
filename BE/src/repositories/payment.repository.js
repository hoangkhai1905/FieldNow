const prisma = require('../infrastructure/prisma');

const createPayment = async (bookingId, amount, provider, tx = prisma) => {
  return tx.payment.create({
    data: {
      booking_id: bookingId,
      amount,
      provider,
      status: 'PENDING',
    },
  });
};

const findById = async (paymentId, tx = prisma) => {
  return tx.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
};

const findByBookingId = async (bookingId, tx = prisma) => {
  return tx.payment.findFirst({
    where: { booking_id: bookingId },
    orderBy: { created_at: 'desc' },
  });
};

const findLatestPendingByBookingId = async (bookingId, provider, tx = prisma) => {
  const where = {
    booking_id: bookingId,
    status: 'PENDING',
  };

  if (provider) {
    where.provider = { equals: provider, mode: 'insensitive' };
  }

  return tx.payment.findFirst({
    where,
    orderBy: { created_at: 'desc' },
  });
};

const updateStatus = async (paymentId, status, tx = prisma) => {
  return tx.payment.update({
    where: { id: paymentId },
    data: { status },
  });
};

const expirePendingByBookingId = async (bookingId, tx = prisma) => {
  return tx.$executeRaw`
    UPDATE "Payment"
    SET "status" = 'EXPIRED'::"PaymentStatus", "updated_at" = NOW()
    WHERE "booking_id" = ${bookingId}::uuid
      AND "status" = 'PENDING'::"PaymentStatus"
  `;
};

const updateProvider = async (paymentId, provider, tx = prisma) => {
  return tx.payment.update({
    where: { id: paymentId },
    data: { provider },
  });
};

const findCashPaymentsByOwner = async (
  ownerId,
  { page = 1, limit = 10, skip = 0, status } = {},
  tx = prisma
) => {
  const where = {
    provider: { equals: 'cash', mode: 'insensitive' },
    booking: {
      field: {
        owner_id: ownerId,
      },
    },
  };

  if (['PENDING', 'COMPLETED'].includes(status)) {
    where.status = status;
  }

  const [payments, total] = await Promise.all([
    tx.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            user: true,
            field: true,
            slot: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    tx.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createPayment,
  findById,
  findByBookingId,
  findLatestPendingByBookingId,
  updateStatus,
  expirePendingByBookingId,
  updateProvider,
  findCashPaymentsByOwner,
};
