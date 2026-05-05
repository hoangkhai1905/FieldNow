const prisma = require('../infrastructure/prisma');

/**
 * OTP Repository — handles all OTP-related database operations
 */

const generateAndSaveOTP = async (email) => {
  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

  const user = await prisma.user.update({
    where: { email },
    data: {
      otp_code: otpCode,
      otp_expires_at: otpExpiresAt,
    },
  });

  return { user, otpCode, otpExpiresAt };
};

const verifyOTP = async (email, otpCode) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (!user.otp_code) {
    return { success: false, message: 'No OTP found for this user' };
  }

  if (user.otp_expires_at < new Date()) {
    return { success: false, message: 'OTP has expired' };
  }

  if (user.otp_code !== otpCode) {
    return { success: false, message: 'Invalid OTP' };
  }

  // Mark email as verified and clear OTP
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      is_email_verified: true,
      otp_code: null,
      otp_expires_at: null,
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
    },
  });
};

module.exports = {
  generateAndSaveOTP,
  verifyOTP,
  clearOTP,
};
