const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/user.repository');
const { errors } = require('../utils/errors');

const register = async (email, password, fullName, role) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw errors.conflict('Email already in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    email,
    password: hashedPassword,
    full_name: fullName,
    role: role || 'USER',
  });

  return { id: user.id, email: user.email, role: user.role };
};

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw errors.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw errors.unauthorized('Invalid email or password');
  }

  // Check if email is verified
  if (!user.is_email_verified) {
    throw errors.unauthorized('Email not verified. Please verify your email first.');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name }
  };
};

module.exports = {
  register,
  login
};