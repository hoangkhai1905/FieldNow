const otpRepository = require('../repositories/otp.repository');
const userRepository = require('../repositories/user.repository');
const { emailQueue } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');
const { errors } = require('../utils/errors');

const OTP_EXPIRES_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

/**
 * OTP Service — handles OTP generation, sending, and verification
 */

const sendOTP = async (emailOrPhone) => {
  // Check if user exists
  const user = await userRepository.findByEmailOrPhone(emailOrPhone);
  if (!user) {
    throw errors.notFound('User not found');
  }

  if (user.otp_resend_available_at && user.otp_resend_available_at > new Date()) {
    throw errors.conflict('OTP resend is on cooldown. Please try again shortly.');
  }

  // Generate and save OTP
  const { otpCode, otpExpiresAt } = await otpRepository.generateAndSaveOTP(user.email, {
    expiresInMs: OTP_EXPIRES_MS,
    resendCooldownMs: OTP_RESEND_COOLDOWN_MS,
  });

  logger.info(`[OTP Service] OTP generated for ${user.email}: ${otpCode} (expires at ${otpExpiresAt})`);

  // Queue email job to send OTP
  await emailQueue.add('email.otp_sent', {
    userId: user.id,
    email: user.email,
    otpCode,
  });

  logger.info(`[OTP Service] OTP email queued for ${user.email}`);

  return {
    success: true,
    message: 'OTP sent to your email',
    expiresIn: 10 * 60 * 1000, // 10 minutes in milliseconds
  };
};

const verifyOTP = async (emailOrPhone, otpCode) => {
  // Check if user exists
  const user = await userRepository.findByEmailOrPhone(emailOrPhone);
  if (!user) {
    throw errors.unauthorized('User not found');
  }

  // Verify OTP
  const result = await otpRepository.verifyOTP(user.email, otpCode, {
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  if (!result.success) {
    throw errors.unauthorized(result.message);
  }

  logger.info(`[OTP Service] OTP verified for ${user.email}`);

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

const resendOTP = async (emailOrPhone) => {
  // Check if user exists
  const user = await userRepository.findByEmailOrPhone(emailOrPhone);
  if (!user) {
    throw errors.notFound('User not found');
  }

  // Don't resend if already verified
  if (user.is_email_verified) {
    throw errors.conflict('Email already verified');
  }

  if (user.otp_resend_available_at && user.otp_resend_available_at > new Date()) {
    throw errors.conflict('OTP resend is on cooldown. Please try again shortly.');
  }

  // Resend OTP (same logic as sendOTP)
  return sendOTP(user.email);
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};
