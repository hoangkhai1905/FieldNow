const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../infrastructure/prisma');
const { errors } = require('../utils/errors');

const register = async (email, password, fullName, role) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw errors.conflict('Email already in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      full_name: fullName,
      role: role || 'USER',
    }
  });

  return { id: user.id, email: user.email, role: user.role };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw errors.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw errors.unauthorized('Invalid email or password');
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