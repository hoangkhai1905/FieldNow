const prisma = require('../../infrastructure/prisma');

const create = async (data) => {
  return prisma.refreshToken.create({ data });
};

const findByHash = async (tokenHash) => {
  return prisma.refreshToken.findUnique({ where: { token_hash: tokenHash } });
};

const revokeById = async (id) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { revoked_at: new Date() },
  });
};

const touchLastUsed = async (id) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { last_used_at: new Date() },
  });
};

const deleteOldestTokens = async (userId, maxTokens) => {
  const tokens = await prisma.refreshToken.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });

  if (tokens.length <= maxTokens) return;

  const toDelete = tokens.slice(0, tokens.length - maxTokens).map((t) => t.id);
  await prisma.refreshToken.deleteMany({ where: { id: { in: toDelete } } });
};

const revokeAllForUser = async (userId) => {
  return prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
};

module.exports = {
  create,
  findByHash,
  revokeById,
  touchLastUsed,
  deleteOldestTokens,
  revokeAllForUser,
};
