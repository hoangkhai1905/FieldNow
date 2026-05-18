const prisma = require('../infrastructure/prisma');

const getOwnerStats = async (ownerId) => {
  const fields = await prisma.field.findMany({
    where: { owner_id: ownerId },
    include: {
      bookings: {
        where: { status: 'CONFIRMED' },
        include: { payments: { where: { status: 'COMPLETED' } } },
      },
    },
  });

  const totalFields = fields.length;
  const activeFields = fields.filter((field) => field.is_active).length;

  let totalRevenue = 0;
  let totalConfirmedBookings = 0;

  fields.forEach((field) => {
    field.bookings.forEach((booking) => {
      totalConfirmedBookings += 1;
      booking.payments.forEach((payment) => {
        totalRevenue += Number(payment.amount);
      });
    });
  });

  return {
    totalFields,
    activeFields,
    totalConfirmedBookings,
    totalRevenue,
  };
};

module.exports = {
  getOwnerStats,
};
