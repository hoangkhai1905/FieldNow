const bookingRepository = require('../repositories/booking.repository');
const paymentRepository = require('../repositories/payment.repository');
const bookingService = require('../services/booking.service');
const fieldService = require('../services/field.service');
const ownerService = require('../services/owner.service');
const paymentService = require('../services/payment.service');
const { parsePagination } = require('../utils/pagination');

const getOwnerBookings = async (req, res, next) => {
  try {
    const result = await bookingRepository.findByOwnerFields(req.user.userId, {
      ...parsePagination(req.query, { limit: 10, maxLimit: 100 }),
      status: req.query.status,
      fieldId: req.query.fieldId,
      date: req.query.date,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getOwnerStats = async (req, res, next) => {
  try {
    const stats = await ownerService.getOwnerStats(req.user.userId);
    res.status(200).json({
      success: true,
      data: stats,
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

const getOwnerCashPayments = async (req, res, next) => {
  try {
    const result = await paymentRepository.findCashPaymentsByOwner(req.user.userId, {
      ...parsePagination(req.query, { limit: 10, maxLimit: 100 }),
      status: req.query.status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const confirmOwnerCashPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.confirmCashPayment(req.params.bookingId, req.user.userId, { scope: 'owner' });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const rejectOwnerBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.rejectOwnerBooking(req.params.bookingId, req.user.userId);
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOwnerBookings,
  getOwnerStats,
  toggleFieldStatus,
  getOwnerCashPayments,
  confirmOwnerCashPayment,
  rejectOwnerBooking,
};
