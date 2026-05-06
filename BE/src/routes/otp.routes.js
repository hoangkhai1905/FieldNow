const express = require('express');
const otpController = require('../controllers/otp.controller');
const { validate } = require('../middlewares/validate.middleware');
const { otpLimiter } = require('../middlewares/rate-limit.middleware');
const { sendOTPSchema, verifyOTPSchema } = require('../validators/otp.validator');

const router = express.Router();

/**
 * POST /api/v1/otp/send
 * Send OTP to user email
 */
router.post('/send', otpLimiter, validate(sendOTPSchema), otpController.sendOTP);

/**
 * POST /api/v1/otp/verify
 * Verify OTP and mark email as verified
 */
router.post('/verify', otpLimiter, validate(verifyOTPSchema), otpController.verifyOTP);

/**
 * POST /api/v1/otp/resend
 * Resend OTP to user email
 */
router.post('/resend', otpLimiter, validate(sendOTPSchema), otpController.resendOTP);

module.exports = router;
