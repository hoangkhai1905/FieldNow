const { z } = require('zod');

/**
 * Password Reset and Change Password validation schemas using Zod.
 */

const requestPasswordResetSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  otp_code: z
    .string({ required_error: 'OTP code is required' })
    .regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
  new_password: z
    .string({ required_error: 'New password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

const requestChangePasswordSchema = z.object({
  // No parameters needed - userId comes from JWT
});

const changePasswordSchema = z.object({
  otp_code: z
    .string({ required_error: 'OTP code is required' })
    .regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
  new_password: z
    .string({ required_error: 'New password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

module.exports = {
  requestPasswordResetSchema,
  resetPasswordSchema,
  requestChangePasswordSchema,
  changePasswordSchema,
};
