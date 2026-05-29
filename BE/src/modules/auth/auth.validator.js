const { z } = require('zod');

/**
 * Auth validation schemas using Zod.
 * Used by controllers to validate request payloads before passing to services.
 */

const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  fullName: z
    .string()
    .min(1, 'Full name cannot be empty')
    .optional(),
  role: z
    .enum(['USER', 'OWNER'], {
      errorMap: () => ({ message: 'Role must be USER or OWNER' }),
    })
    .optional(),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must be at most 15 characters')
    .optional(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email or Phone number is required' })
    .min(1, 'Email or Phone number is required'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(10, 'Refresh token is required'),
});

const logoutSchema = refreshSchema;

module.exports = { registerSchema, loginSchema, refreshSchema, logoutSchema };
