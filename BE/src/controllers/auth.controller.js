const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.body;
    const user = await authService.register(email, password, fullName, role);
    res.status(201).json({ success: true, data: { message: 'User registered successfully', user } });
  } catch (error) {
    next(error); // Delegates to global error handler
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  // `req.user` is attached by auth middleware
  res.status(200).json({ success: true, data: { user: req.user } });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};