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
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
