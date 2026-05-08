const paymentService = require('../services/payment.service');

const initiatePayment = async (req, res, next) => {
  try {
    const result = await paymentService.initiatePayment(req.body.bookingId, req.user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /payments/sepay-ipn
 * Server-to-server callback from SePay after each transaction.
 * SePay expects HTTP 200 with { success: true } to acknowledge receipt.
 */
const handleSepayIpn = async (req, res, next) => {
  try {
    const result = await paymentService.handleSepayIpn(req.headers, req.body);
    res.status(200).json(result);
  } catch (error) {
    // Always respond 200 to SePay; log the error server-side
    res.status(200).json({ success: false, error: error.message });
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
  handleSepayIpn,
  getPaymentDetail,
};
