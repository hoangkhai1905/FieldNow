const userRepository = require('../repositories/user.repository');
const { emailQueue } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');
const { errors } = require('../utils/errors');
const bcrypt = require('bcryptjs');

/**
 * Change Password Service — handles password change with OTP verification
 */

const requestChangePassword = async (userId) => {
  // Find user
  const user = await userRepository.findById(userId);
  if (!user) {
    throw errors.notFound('User not found');
  }

  // Generate OTP for change password verification
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

  await userRepository.updateById(userId, {
    otp_code: otpCode,
    otp_expires_at: otpExpiresAt,
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
    expiresIn: 10 * 60 * 1000, // 10 minutes in milliseconds
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

  if (user.otp_code !== otpCode) {
    throw errors.unauthorized('Invalid OTP');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear OTP
  const updatedUser = await userRepository.updateById(userId, {
    password: hashedPassword,
    otp_code: null,
    otp_expires_at: null,
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
