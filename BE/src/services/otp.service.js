const otpRepository = require('../repositories/otp.repository');
const userRepository = require('../repositories/user.repository');
const { emailQueue } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');
const { errors } = require('../utils/errors');

/**
 * OTP Service — handles OTP generation, sending, and verification
 */

const sendOTP = async (email) => {
  // Check if user exists
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw errors.notFound('User not found');
  }

  // Generate and save OTP
  const { otpCode, otpExpiresAt } = await otpRepository.generateAndSaveOTP(email);

  logger.info(`[OTP Service] OTP generated for ${email}: ${otpCode} (expires at ${otpExpiresAt})`);

  // Queue email job to send OTP
  await emailQueue.add('email.otp_sent', {
    userId: user.id,
    email: user.email,
    otpCode,
  });

  logger.info(`[OTP Service] OTP email queued for ${email}`);

  return {
    success: true,
    message: 'OTP sent to your email',
    expiresIn: 10 * 60 * 1000, // 10 minutes in milliseconds
  };
};

const verifyOTP = async (email, otpCode) => {
  // Verify OTP
  const result = await otpRepository.verifyOTP(email, otpCode);

  if (!result.success) {
    throw errors.unauthorized(result.message);
  }

  logger.info(`[OTP Service] OTP verified for ${email}`);

  return {
    success: true,
    message: 'Email verified successfully',
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      full_name: result.user.full_name,
      is_email_verified: result.user.is_email_verified,
    },
  };
};

const resendOTP = async (email) => {
  // Check if user exists
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw errors.notFound('User not found');
  }

  // Don't resend if already verified
  if (user.is_email_verified) {
    throw errors.conflict('Email already verified');
  }

  // Resend OTP (same logic as sendOTP)
  return sendOTP(email);
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};
