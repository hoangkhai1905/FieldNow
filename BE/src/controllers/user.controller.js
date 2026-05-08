const userService = require('../services/user.service');

const updateProfile = async (req, res, next) => {
  try {
    const result = await userService.updateProfile(req.user.userId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deactivateAccount = async (req, res, next) => {
  try {
    const result = await userService.deactivateAccount(req.user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  deactivateAccount,
};
