const prisma = require('../infrastructure/prisma');

/**
 * Slot repository — encapsulates all Prisma queries for the FieldSlot model.
 */

const create = async (data) => {
  return prisma.fieldSlot.create({ data });
};

const createMany = async (slots) => {
  return prisma.fieldSlot.createMany({ data: slots, skipDuplicates: true });
};

const findById = async (id) => {
  return prisma.fieldSlot.findUnique({ where: { id } });
};

const update = async (id, data) => {
  return prisma.fieldSlot.update({ where: { id }, data });
};

const deleteById = async (id) => {
  return prisma.fieldSlot.delete({ where: { id } });
};

const findByFieldAndDate = async (fieldId, date) => {
  return prisma.fieldSlot.findMany({
    where: {
      field_id: fieldId,
      date: new Date(date),
    },
    orderBy: { start_time: 'asc' },
  });
};

const findByFieldDateRange = async (fieldId, startDate, endDate) => {
  return prisma.fieldSlot.findMany({
    where: {
      field_id: fieldId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
  });
};

module.exports = {
  create,
  createMany,
  findById,
  update,
  deleteById,
  findByFieldAndDate,
  findByFieldDateRange,
};
