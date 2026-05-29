const bookingService = require('./booking.service');
const { parsePagination } = require('../../common/utils/pagination');

const createBooking = async (req, res, next) => {
  try {
    const { fieldId, date, startTime, endTime } = req.body;
    const booking = await bookingService.createBooking(req.user.userId, { 
      fieldId, 
      date, 
      startTime, 
      endTime 
    });
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query, { limit: 6, maxLimit: 50 });
    const result = await bookingService.getUserBookings(req.user.userId, {
      ...pagination,
      status: req.query.status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getBookingDetail = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
};
