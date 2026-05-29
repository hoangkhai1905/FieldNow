const { z } = require('zod');

/**
 * Slot validation schemas.
 */

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createSlotSchema = z.object({
  date: z
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z
    .string({ required_error: 'Start time is required' })
    .regex(timeRegex, 'Start time must be in HH:mm format'),
  endTime: z
    .string({ required_error: 'End time is required' })
    .regex(timeRegex, 'End time must be in HH:mm format'),
  priceOverride: z
    .number()
    .positive('Price override must be positive')
    .optional()
    .nullable(),
});

const batchCreateSlotsSchema = z.object({
  slots: z
    .array(createSlotSchema)
    .min(1, 'At least one slot is required')
    .max(50, 'Maximum 50 slots per batch'),
});

const updateSlotSchema = z.object({
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
  priceOverride: z.number().positive().optional().nullable(),
  isLocked: z.boolean().optional(),
});

module.exports = { createSlotSchema, batchCreateSlotsSchema, updateSlotSchema };
