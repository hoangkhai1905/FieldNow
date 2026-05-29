const prisma = require('../../infrastructure/prisma');

/**
 * User repository — encapsulates all Prisma queries for the User model.
 * Services should use these methods instead of calling Prisma directly.
 */

const findByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const findByPhoneNumber = async (phoneNumber) => {
  return prisma.user.findFirst({ where: { phone_number: phoneNumber } });
};

const findByEmailOrPhone = async (identifier) => {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone_number: identifier },
      ],
    },
  });
};

const findById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

const create = async (data) => {
  return prisma.user.create({ data });
};

const updateByEmail = async (email, data) => {
  return prisma.user.update({
    where: { email },
    data,
  });
};

const updateById = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

module.exports = {
  findByEmail,
  findByPhoneNumber,
  findByEmailOrPhone,
  findById,
  create,
  updateByEmail,
  updateById,
};