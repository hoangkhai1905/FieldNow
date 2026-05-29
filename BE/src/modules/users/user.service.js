const userRepository = require('./user.repository');
const refreshTokenRepository = require('../auth/refresh-token.repository');
const { errors } = require('../../common/utils/errors');

const updateProfile = async (userId, data) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw errors.notFound('User');
  }

  const updateData = {};
  if (data.fullName !== undefined) updateData.full_name = data.fullName;
  if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber;
  if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

  const updated = await userRepository.updateById(userId, updateData);
  return {
    id: updated.id,
    email: updated.email,
    full_name: updated.full_name,
    phone_number: updated.phone_number,
    avatar_url: updated.avatar_url,
    role: updated.role,
  };
};

const deactivateAccount = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw errors.notFound('User');
  }

  await refreshTokenRepository.revokeAllForUser(userId);

  const updated = await userRepository.updateById(userId, {
    is_active: false,
    deactivated_at: new Date(),
  });

  return {
    id: updated.id,
    email: updated.email,
    is_active: updated.is_active,
  };
};

module.exports = {
  updateProfile,
  deactivateAccount,
};
