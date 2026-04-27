const { AppError } = require('../utils/errors');

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * On failure, throws an AppError with VALIDATION_ERROR code and field-level details.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const fieldErrors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid request payload',
      400,
      fieldErrors
    );
  }
  req.body = result.data; // Replace with parsed/sanitized data
  next();
};

module.exports = { validate };
