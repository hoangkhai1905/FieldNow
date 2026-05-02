const paymentService = require('../services/payment.service');

const initiatePayment = async (req, res, next) => {
  try {
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const result = await paymentService.initiatePayment(req.body.bookingId, req.user.userId, ipAddr);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const handleVNPayReturn = async (req, res, next) => {
  try {
    const result = await paymentService.handleVNPayReturn(req.query);
    // In a real app, you might redirect the user to a frontend URL instead of JSON
    // e.g., res.redirect(`http://frontend.com/payment/result?bookingId=${result.bookingId}&success=${result.isSuccess}`);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const handleVNPayIpn = async (req, res, next) => {
  try {
    const result = await paymentService.handleVNPayIpn(req.query);
    res.status(200).json(result);
  } catch (error) {
    // VNPay expects a specific JSON format even on error
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

const getPaymentDetail = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByBookingId(req.params.bookingId, req.user.userId);
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  handleVNPayReturn,
  handleVNPayIpn,
  getPaymentDetail,
};
