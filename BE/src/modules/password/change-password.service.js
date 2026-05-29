const userRepository = require('../users/user.repository');
const { emailQueue } = require('../../infrastructure/queue');
const { logger } = require('../../infrastructure/logger');
const { errors } = require('../../common/utils/errors');
const { hashOtp } = require('../../common/utils/otp');
const bcrypt = require('bcryptjs');
const OTP_EXPIRES_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

/**
 * Change Password Service — handles password change with OTP verification
 */

const requestChangePassword = async (userId) => {
  // Find user
  const user = await userRepository.findById(userId);
  if (!user) {
    throw errors.notFound('User not found');
  }

  if (user.otp_resend_available_at && user.otp_resend_available_at > new Date()) {
    return {
      success: true,
      message: 'OTP already sent recently. Please wait before requesting again.',
      expiresIn: OTP_EXPIRES_MS,
    };
  }

  // Generate OTP for change password verification
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MS);
  const now = new Date();
  const otpResendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS);

  await userRepository.updateById(userId, {
    otp_code: hashOtp(otpCode),
    otp_expires_at: otpExpiresAt,
    otp_attempts: 0,
    otp_last_sent_at: now,
    otp_resend_available_at: otpResendAvailableAt,
  });

  logger.info(`[Change Password] OTP generated for ${user.email}: ${otpCode} (expires at ${otpExpiresAt})`);

  // Queue email job to send change password OTP
  await emailQueue.add('email.change_password_otp', {
    userId: user.id,
    email: user.email,
    otpCode,
  });

  logger.info(`[Change Password] OTP email queued for ${user.email}`);

  return {
    success: true,
    message: 'OTP sent to your email for password change verification',
    expiresIn: OTP_EXPIRES_MS,
  };
};

const changePassword = async (userId, otpCode, newPassword) => {
  // Find user
  const user = await userRepository.findById(userId);
  if (!user) {
    throw errors.notFound('User not found');
  }

  // Validate OTP
  if (!user.otp_code) {
    throw errors.unauthorized('No change password request found');
  }

  if (user.otp_expires_at < new Date()) {
    throw errors.unauthorized('OTP has expired. Please request a new one.');
  }

  if (user.otp_attempts >= OTP_MAX_ATTEMPTS) {
    throw errors.unauthorized('OTP attempts exceeded');
  }

  if (user.otp_code !== hashOtp(otpCode)) {
    await userRepository.updateById(userId, {
      otp_attempts: (user.otp_attempts || 0) + 1,
    });
    throw errors.unauthorized('Invalid OTP');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear OTP
  const updatedUser = await userRepository.updateById(userId, {
    password: hashedPassword,
    otp_code: null,
    otp_expires_at: null,
    otp_attempts: 0,
    otp_resend_available_at: null,
  });

  logger.info(`[Change Password] Password changed successfully for ${user.email}`);

  return {
    success: true,
    message: 'Password changed successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    },
  };
};

module.exports = {
  requestChangePassword,
  changePassword,
};
