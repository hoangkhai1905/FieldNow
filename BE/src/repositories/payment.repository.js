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

const updateStatus = async (paymentId, status, tx = prisma) => {
  return tx.payment.update({
    where: { id: paymentId },
    data: { status },
  });
};

module.exports = {
  createPayment,
  findById,
  findByBookingId,
  updateStatus,
};
