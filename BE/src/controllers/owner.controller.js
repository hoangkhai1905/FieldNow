const bookingRepository = require('../repositories/booking.repository');
const fieldService = require('../services/field.service');
const prisma = require('../infrastructure/prisma');

const getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await bookingRepository.findByOwnerFields(req.user.userId);
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const getOwnerStats = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;

    const fields = await prisma.field.findMany({
      where: { owner_id: ownerId },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
          include: { payments: { where: { status: 'COMPLETED' } } }
        }
      }
    });

    const totalFields = fields.length;
    const activeFields = fields.filter(f => f.is_active).length;
    
    let totalRevenue = 0;
    let totalConfirmedBookings = 0;

    fields.forEach(field => {
      field.bookings.forEach(booking => {
        totalConfirmedBookings++;
        booking.payments.forEach(payment => {
          totalRevenue += parseFloat(payment.amount.toString());
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        totalFields,
        activeFields,
        totalConfirmedBookings,
        totalRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

const toggleFieldStatus = async (req, res, next) => {
  try {
    const field = await fieldService.toggleFieldStatus(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: field });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOwnerBookings,
  getOwnerStats,
  toggleFieldStatus,
};
