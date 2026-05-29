const { z } = require('zod');

/**
 * OTP validation schemas using Zod.
 */

const sendOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
});

const verifyOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  otp_code: z
    .string({ required_error: 'OTP code is required' })
    .regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

module.exports = { sendOTPSchema, verifyOTPSchema };
