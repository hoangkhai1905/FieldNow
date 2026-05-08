const express = require('express');
const { validate } = require('../middlewares/validate.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  passwordResetLimiter,
  passwordChangeLimiter,
} = require('../middlewares/rate-limit.middleware');
const {
  requestPasswordReset,
  resetPassword,
  requestChangePassword,
  changePassword,
} = require('../controllers/password.controller');
const {
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../validators/password.validator');

const router = express.Router();

/**
 * POST /api/v1/password/forgot
 * Request password reset via email OTP
 * Public endpoint - no authentication required
 */
router.post('/forgot', passwordResetLimiter, validate(requestPasswordResetSchema), requestPasswordReset);

/**
 * POST /api/v1/password/reset
 * Reset password using OTP
 * Public endpoint - no authentication required
 */
router.post('/reset', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

/**
 * POST /api/v1/password/change-request
 * Request to change password (generates OTP)
 * Protected endpoint - requires JWT authentication
 */
router.post('/change-request', authMiddleware, passwordChangeLimiter, requestChangePassword);

/**
 * POST /api/v1/password/change
 * Change password using OTP
 * Protected endpoint - requires JWT authentication
 */
router.post('/change', authMiddleware, passwordChangeLimiter, validate(changePasswordSchema), changePassword);

module.exports = router;
