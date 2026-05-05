const express = require('express');
const otpController = require('../controllers/otp.controller');
const { validate } = require('../middlewares/validate.middleware');
const { sendOTPSchema, verifyOTPSchema } = require('../validators/otp.validator');

const router = express.Router();

/**
 * POST /api/v1/otp/send
 * Send OTP to user email
 */
router.post('/send', validate(sendOTPSchema), otpController.sendOTP);

/**
 * POST /api/v1/otp/verify
 * Verify OTP and mark email as verified
 */
router.post('/verify', validate(verifyOTPSchema), otpController.verifyOTP);

/**
 * POST /api/v1/otp/resend
 * Resend OTP to user email
 */
router.post('/resend', validate(sendOTPSchema), otpController.resendOTP);

module.exports = router;
