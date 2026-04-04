const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const user = await authService.register(email, password, fullName, role);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const me = async (req, res) => {
  // `req.user` is attached by auth middleware
  res.status(200).json({ user: req.user });
};

module.exports = {
  register,
  login,
  me
};