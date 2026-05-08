const userRepository = require('../repositories/user.repository');
const { emailQueue } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');
const { errors } = require('../utils/errors');
const { hashOtp } = require('../utils/otp');
const bcrypt = require('bcryptjs');
const OTP_EXPIRES_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

/**
 * Password Reset Service — handles forgot password flow with OTP
 */

const requestPasswordReset = async (email) => {
  // Check if user exists
  const user = await userRepository.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists (security best practice)
    logger.warn(`[Password Reset] Password reset requested for non-existent email: ${email}`);
    return {
      success: true,
      message: 'If email exists, reset instructions will be sent',
      expiresIn: OTP_EXPIRES_MS,
    };
  }

  if (user.otp_resend_available_at && user.otp_resend_available_at > new Date()) {
    return {
      success: true,
      message: 'If email exists, reset instructions will be sent',
      expiresIn: OTP_EXPIRES_MS,
    };
  }

  // Generate and save OTP for password reset
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MS);
  const now = new Date();
  const otpResendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS);

  await userRepository.updateByEmail(email, {
    otp_code: hashOtp(otpCode),
    otp_expires_at: otpExpiresAt,
    otp_attempts: 0,
    otp_last_sent_at: now,
    otp_resend_available_at: otpResendAvailableAt,
  });

  logger.info(`[Password Reset] OTP generated for ${email}: ${otpCode} (expires at ${otpExpiresAt})`);

  // Queue email job to send reset OTP
  await emailQueue.add('email.password_reset_otp', {
    userId: user.id,
    email: user.email,
    otpCode,
  });

  logger.info(`[Password Reset] Reset OTP email queued for ${email}`);

  return {
    success: true,
    message: 'If email exists, reset instructions will be sent',
    expiresIn: OTP_EXPIRES_MS,
  };
};

const resetPassword = async (email, otpCode, newPassword) => {
  // Find user
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw errors.notFound('User not found');
  }

  // Validate OTP
  if (!user.otp_code) {
    throw errors.unauthorized('No password reset request found');
  }

  if (user.otp_expires_at < new Date()) {
    throw errors.unauthorized('Reset OTP has expired');
  }

  if (user.otp_attempts >= OTP_MAX_ATTEMPTS) {
    throw errors.unauthorized('OTP attempts exceeded');
  }

  if (user.otp_code !== hashOtp(otpCode)) {
    await userRepository.updateByEmail(email, {
      otp_attempts: (user.otp_attempts || 0) + 1,
    });
    throw errors.unauthorized('Invalid OTP');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear OTP
  const updatedUser = await userRepository.updateByEmail(email, {
    password: hashedPassword,
    otp_code: null,
    otp_expires_at: null,
    otp_attempts: 0,
    otp_resend_available_at: null,
  });

  logger.info(`[Password Reset] Password reset successful for ${email}`);

  return {
    success: true,
    message: 'Password reset successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    },
  };
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
