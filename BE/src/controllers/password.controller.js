const passwordResetService = require('../services/password-reset.service');
const changePasswordService = require('../services/change-password.service');

/**
 * Password Controllers — handles HTTP requests for password reset and change
 */

// ===== PASSWORD RESET =====

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await passwordResetService.requestPasswordReset(email);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp_code, new_password } = req.body;
    const result = await passwordResetService.resetPassword(email, otp_code, new_password);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ===== CHANGE PASSWORD =====

const requestChangePassword = async (req, res, next) => {
  try {
    // userId comes from auth middleware (JWT)
    const userId = req.user.userId;
    const result = await changePasswordService.requestChangePassword(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    // userId comes from auth middleware (JWT)
    const userId = req.user.userId;
    const { otp_code, new_password } = req.body;
    const result = await changePasswordService.changePassword(userId, otp_code, new_password);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  requestChangePassword,
  changePassword,
};
