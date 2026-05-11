const { Prisma } = require('@prisma/client');
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
  let whereSql = Prisma.sql`"Field"."is_active" = true`;

  if (location) {
    whereSql = Prisma.sql`${whereSql} AND "Field"."search_vector" @@ plainto_tsquery('simple', ${location})`;
  }
  if (minPrice !== undefined) {
    whereSql = Prisma.sql`${whereSql} AND "Field"."price_per_hour" >= ${minPrice}`;
  }
  if (maxPrice !== undefined) {
    whereSql = Prisma.sql`${whereSql} AND "Field"."price_per_hour" <= ${maxPrice}`;
  }
  const skip = (page - 1) * limit;
  const orderBySql = location
    ? Prisma.sql`ORDER BY ts_rank("Field"."search_vector", plainto_tsquery('simple', ${location})) DESC`
    : Prisma.sql`ORDER BY "Field"."created_at" DESC`;

  const [fields, countRows] = await Promise.all([
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          "id",
          "owner_id",
          "name",
          "location",
          "description",
          "images",
          "price_per_hour",
          "type",
          "is_active",
          "created_at",
          "updated_at"
        FROM "Field"
        WHERE ${whereSql}
        ${orderBySql}
        LIMIT ${limit} OFFSET ${skip}
      `
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM "Field"
        WHERE ${whereSql}
      `
    ),
  ]);

  const total = countRows[0]?.total ?? 0;

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
