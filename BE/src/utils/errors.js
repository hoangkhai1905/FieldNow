/**
 * Standardized application error class.
 * All service/domain errors should use this to ensure consistent API responses.
 */
class AppError extends Error {
  /**
   * @param {string} code - Machine-readable error code (e.g. VALIDATION_ERROR, UNAUTHORIZED)
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {object} [details] - Optional additional error details
   */
  constructor(code, message, statusCode, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

// --- Factory helpers for common errors ---

const errors = {
  validation: (message, details = null) =>
    new AppError('VALIDATION_ERROR', message, 400, details),

  unauthorized: (message = 'Invalid credentials or token') =>
    new AppError('UNAUTHORIZED', message, 401),

  forbidden: (message = 'Insufficient permissions') =>
    new AppError('FORBIDDEN', message, 403),

  notFound: (resource = 'Resource') =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),

  conflict: (message) =>
    new AppError('CONFLICT', message, 409),

  slotLocked: () =>
    new AppError('SLOT_LOCKED', 'Slot is currently being booked by another user', 423),

  slotTaken: () =>
    new AppError('SLOT_TAKEN', 'Slot is already booked', 409),

  bookingExpired: () =>
    new AppError('BOOKING_EXPIRED', 'Booking has expired', 410),

  bookingNotOwned: () =>
    new AppError('BOOKING_NOT_OWNED', 'You do not own this booking', 403),

  paymentAlreadyCompleted: () =>
    new AppError('PAYMENT_ALREADY_COMPLETED', 'Payment has already been completed', 409),

  paymentAlreadyFailed: () =>
    new AppError('PAYMENT_ALREADY_FAILED', 'Payment has already failed', 409),

  internal: (message = 'An unexpected error occurred') =>
    new AppError('INTERNAL_ERROR', message, 500),
};

module.exports = { AppError, errors };
