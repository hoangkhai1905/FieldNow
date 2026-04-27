const { AppError } = require('../utils/errors');

/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent JSON envelope:
 *
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Email is required",
 *     "details": { ... }   // optional
 *   }
 * }
 */
const errorHandler = (err, req, res, _next) => {
  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Unknown / unhandled errors
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

module.exports = { errorHandler };
