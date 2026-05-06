const { z } = require('zod');

/**
 * Field validation schemas.
 */

const createFieldSchema = z.object({
  name: z
    .string({ required_error: 'Field name is required' })
    .min(1, 'Field name cannot be empty')
    .max(200, 'Field name too long'),
  location: z
    .string({ required_error: 'Location is required' })
    .min(1, 'Location cannot be empty')
    .max(500, 'Location too long'),
  description: z
    .string()
    .max(2000, 'Description too long')
    .optional(),
  images: z
    .array(
      z.string()
        .url('Each image must be a valid URL')
        .startsWith('https://', 'Image URLs must use HTTPS')
        .refine((url) => {
          const allowedDomains = ['example.com', 'cloudinary.com', 'aws.com', 'supabase.co'];
          try {
            const hostname = new URL(url).hostname;
            return allowedDomains.some((domain) => hostname.endsWith(domain));
          } catch {
            return false;
          }
        }, { message: 'Image domain not allowed' })
    )
    .max(10, 'Maximum 10 images allowed')
    .default([]),
  pricePerHour: z
    .number({ required_error: 'Price per hour is required' })
    .positive('Price must be positive'),
  type: z.enum(['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS']).optional(),
});

const updateFieldSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  images: z
    .array(
      z.string()
        .url('Each image must be a valid URL')
        .startsWith('https://', 'Image URLs must use HTTPS')
        .refine((url) => {
          const allowedDomains = ['example.com', 'cloudinary.com', 'aws.com', 'supabase.co'];
          try {
            const hostname = new URL(url).hostname;
            return allowedDomains.some((domain) => hostname.endsWith(domain));
          } catch {
            return false;
          }
        }, { message: 'Image domain not allowed' })
    )
    .max(10, 'Maximum 10 images allowed')
    .optional(),
  pricePerHour: z.number().positive('Price must be positive').optional(),
  type: z.enum(['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS']).optional(),
});

module.exports = { createFieldSchema, updateFieldSchema };
