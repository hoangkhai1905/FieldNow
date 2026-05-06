const express = require('express');
const { validate } = require('../middlewares/validate.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');
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
router.post('/forgot', validate(requestPasswordResetSchema), requestPasswordReset);

/**
 * POST /api/v1/password/reset
 * Reset password using OTP
 * Public endpoint - no authentication required
 */
router.post('/reset', validate(resetPasswordSchema), resetPassword);

/**
 * POST /api/v1/password/change-request
 * Request to change password (generates OTP)
 * Protected endpoint - requires JWT authentication
 */
router.post('/change-request', authMiddleware, requestChangePassword);

/**
 * POST /api/v1/password/change
 * Change password using OTP
 * Protected endpoint - requires JWT authentication
 */
router.post('/change', authMiddleware, validate(changePasswordSchema), changePassword);

module.exports = router;
