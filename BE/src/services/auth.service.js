const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refresh-token.repository');
const otpService = require('./otp.service');
const { errors } = require('../utils/errors');

const register = async (email, password, fullName, role, phoneNumber) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw errors.conflict('Email already in use');
  }

  const finalPhone = phoneNumber || `09${Math.floor(10000000 + Math.random() * 90000000)}`;

  const existingPhone = await userRepository.findByPhoneNumber(finalPhone);
  if (existingPhone) {
    throw errors.conflict('Phone number already in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    email,
    password: hashedPassword,
    full_name: fullName,
    role: role || 'USER',
    phone_number: finalPhone,
  });

  // Automatically trigger OTP sending after registration
  try {
    await otpService.sendOTP(user.email);
  } catch (error) {
    console.error(`[Auth] Failed to send initial OTP to ${user.email}: ${error.message}`);
    // We don't throw the error here so the registration still succeeds,
    // the user can request a new OTP later if the email failed.
  }

  return { id: user.id, email: user.email, role: user.role };
};

const createAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const issueRefreshToken = async (userId) => {
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await refreshTokenRepository.create({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  await refreshTokenRepository.deleteOldestTokens(userId, config.refreshTokenMaxPerUser);

  return refreshToken;
};

const login = async (email, password) => {
  const user = await userRepository.findByEmailOrPhone(email);
  if (!user) {
    throw errors.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    throw errors.forbidden('Account is deactivated');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw errors.unauthorized('Invalid email or password');
  }

  // Check if email is verified
  if (!user.is_email_verified) {
    throw errors.unauthorized('Email not verified. Please verify your email first.');
  }

  const token = createAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);

  return {
    token,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name }
  };
};

const refreshToken = async (token) => {
  const tokenHash = hashToken(token);
  const stored = await refreshTokenRepository.findByHash(tokenHash);

  if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
    throw errors.unauthorized('Invalid or expired refresh token');
  }

  const user = await userRepository.findById(stored.user_id);
  if (!user || !user.is_active) {
    throw errors.forbidden('Account is deactivated');
  }

  await refreshTokenRepository.revokeById(stored.id);

  const newAccessToken = createAccessToken(user);
  const newRefreshToken = await issueRefreshToken(user.id);
  await refreshTokenRepository.touchLastUsed(stored.id);

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (token) => {
  const tokenHash = hashToken(token);
  const stored = await refreshTokenRepository.findByHash(tokenHash);
  if (!stored || stored.revoked_at) {
    return { success: true };
  }

  await refreshTokenRepository.revokeById(stored.id);
  return { success: true };
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
};