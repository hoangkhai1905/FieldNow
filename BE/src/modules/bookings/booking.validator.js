const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createBookingSchema = z.object({
  fieldId: z.string().uuid('Invalid field ID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(timeRegex, 'Invalid start time format (HH:mm)'),
  endTime: z.string().regex(timeRegex, 'Invalid end time format (HH:mm)'),
});

module.exports = {
  createBookingSchema,
};
