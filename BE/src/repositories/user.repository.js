const prisma = require('../infrastructure/prisma');

/**
 * User repository — encapsulates all Prisma queries for the User model.
 * Services should use these methods instead of calling Prisma directly.
 */

const findByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const findById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

const create = async (data) => {
  return prisma.user.create({ data });
};

module.exports = {
  findByEmail,
  findById,
  create,
};