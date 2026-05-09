const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');

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

const me = async (req, res, next) => {
  try {
    // `req.user` is attached by auth middleware (contains id from token)
    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};