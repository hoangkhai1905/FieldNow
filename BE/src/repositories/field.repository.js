const prisma = require('../infrastructure/prisma');

/**
 * Field repository — encapsulates all Prisma queries for the Field model.
 */

const create = async (data) => {
  return prisma.field.create({ data });
};

const findById = async (id) => {
  return prisma.field.findUnique({ where: { id } });
};

const update = async (id, data) => {
  return prisma.field.update({ where: { id }, data });
};

const findByOwner = async (ownerId) => {
  return prisma.field.findMany({
    where: { owner_id: ownerId },
    orderBy: { created_at: 'desc' },
  });
};

const findPublicWithFilters = async ({ location, minPrice, maxPrice, page = 1, limit = 10 }) => {
  const where = { is_active: true };

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price_per_hour = {};
    if (minPrice !== undefined) where.price_per_hour.gte = minPrice;
    if (maxPrice !== undefined) where.price_per_hour.lte = maxPrice;
  }

  const skip = (page - 1) * limit;

  const [fields, total] = await Promise.all([
    prisma.field.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.field.count({ where }),
  ]);

  return {
    fields,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findByIdWithSlots = async (id, dateFilter) => {
  const include = {
    slots: {
      orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
    },
  };

  if (dateFilter) {
    include.slots.where = { date: new Date(dateFilter) };
  }

  return prisma.field.findUnique({
    where: { id },
    include,
  });
};

module.exports = {
  create,
  findById,
  update,
  findByOwner,
  findPublicWithFilters,
  findByIdWithSlots,
};
