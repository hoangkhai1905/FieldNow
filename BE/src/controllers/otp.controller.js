const otpService = require('../services/otp.service');

/**
 * OTP Controller — handles HTTP requests for OTP operations
 */

const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await otpService.sendOTP(email);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp_code } = req.body;
    const result = await otpService.verifyOTP(email, otp_code);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await otpService.resendOTP(email);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};
