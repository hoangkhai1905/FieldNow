const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name cannot be empty').optional(),
  phoneNumber: z.string().min(5, 'Phone number is too short').optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

const deactivateAccountSchema = z.object({});

module.exports = { updateProfileSchema, deactivateAccountSchema };
