const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../infrastructure/prisma');

const register = async (email, password, fullName, role) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already in use');
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
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
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