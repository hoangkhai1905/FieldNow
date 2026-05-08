const prisma = require('../infrastructure/prisma');
const { hashOtp } = require('../utils/otp');

/**
 * OTP Repository — handles all OTP-related database operations
 */

const generateAndSaveOTP = async (
  email,
  { expiresInMs = 10 * 60 * 1000, resendCooldownMs = 60 * 1000 } = {}
) => {
  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + expiresInMs);
  const now = new Date();
  const otpResendAvailableAt = new Date(now.getTime() + resendCooldownMs);

  const user = await prisma.user.update({
    where: { email },
    data: {
      otp_code: hashOtp(otpCode),
      otp_expires_at: otpExpiresAt,
      otp_attempts: 0,
      otp_last_sent_at: now,
      otp_resend_available_at: otpResendAvailableAt,
    },
  });

  return { user, otpCode, otpExpiresAt };
};

const verifyOTP = async (email, otpCode, { maxAttempts = 5 } = {}) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (!user.otp_code) {
    return { success: false, message: 'No OTP found for this user' };
  }

  if (user.otp_attempts >= maxAttempts) {
    return { success: false, message: 'OTP attempts exceeded' };
  }

  if (user.otp_expires_at < new Date()) {
    return { success: false, message: 'OTP has expired' };
  }

  if (user.otp_code !== hashOtp(otpCode)) {
    await prisma.user.update({
      where: { email },
      data: { otp_attempts: { increment: 1 } },
    });
    return { success: false, message: 'Invalid OTP' };
  }

  // Mark email as verified and clear OTP
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      is_email_verified: true,
      otp_code: null,
      otp_expires_at: null,
      otp_attempts: 0,
      otp_resend_available_at: null,
    },
  });

  return { success: true, user: updatedUser };
};

const clearOTP = async (email) => {
  return prisma.user.update({
    where: { email },
    data: {
      otp_code: null,
      otp_expires_at: null,
      otp_attempts: 0,
      otp_resend_available_at: null,
    },
  });
};

module.exports = {
  generateAndSaveOTP,
  verifyOTP,
  clearOTP,
};
