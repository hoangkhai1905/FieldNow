const { Prisma } = require('@prisma/client');
const prisma = require('../../infrastructure/prisma');
const { buildPagination } = require('../../common/utils/pagination');

/**
 * Field repository — encapsulates all Prisma queries for the Field model.
 */

const create = async (data) => {
  return prisma.field.create({ data });
};

const findById = async (id, tx = prisma) => {
  return tx.field.findUnique({ where: { id } });
};

const update = async (id, data) => {
  return prisma.field.update({ where: { id }, data });
};

const findByOwner = async (ownerId, { page = 1, limit = 8, skip = 0 } = {}) => {
  const where = { owner_id: ownerId };
  const [fields, total, active, pending] = await Promise.all([
    prisma.field.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.field.count({ where }),
    prisma.field.count({ where: { ...where, is_active: true } }),
    prisma.field.count({ where: { ...where, is_active: false } }),
  ]);

  return {
    fields,
    pagination: buildPagination({ page, limit, total }),
    summary: {
      total,
      active,
      pending,
    },
  };
};

const findPublicWithFilters = async ({ location, type, minPrice, maxPrice, sortBy, sortOrder, page = 1, limit = 10 }) => {
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
  if (['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS'].includes(type)) {
    whereSql = Prisma.sql`${whereSql} AND "Field"."type" = ${type}::"FieldType"`;
  }
  const skip = (page - 1) * limit;

  let orderBySql;
  if (sortBy === 'price') {
    orderBySql = sortOrder === 'asc'
      ? Prisma.sql`ORDER BY "Field"."price_per_hour" ASC`
      : Prisma.sql`ORDER BY "Field"."price_per_hour" DESC`;
  } else if (sortBy === 'name') {
    orderBySql = sortOrder === 'asc'
      ? Prisma.sql`ORDER BY "Field"."name" ASC`
      : Prisma.sql`ORDER BY "Field"."name" DESC`;
  } else if (sortBy === 'created_at') {
    orderBySql = sortOrder === 'asc'
      ? Prisma.sql`ORDER BY "Field"."created_at" ASC`
      : Prisma.sql`ORDER BY "Field"."created_at" DESC`;
  } else {
    orderBySql = location
      ? Prisma.sql`ORDER BY ts_rank("Field"."search_vector", plainto_tsquery('simple', ${location})) DESC`
      : Prisma.sql`ORDER BY "Field"."created_at" DESC`;
  }

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
          "open_time",
          "close_time",
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
      currentPage: page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findForAdmin = async ({ status = 'pending', page = 1, limit = 10, skip = 0 } = {}) => {
  const where = {};
  if (status === 'pending') where.is_active = false;
  if (status === 'active') where.is_active = true;

  const [fields, total] = await Promise.all([
    prisma.field.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.field.count({ where }),
  ]);

  return {
    fields,
    pagination: buildPagination({ page, limit, total }),
  };
};

const findByIdWithSlots = async (id, dateFilter) => {
  const include = {
    owner: {
      select: {
        id: true,
        phone_number: true,
      },
    },
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
  findForAdmin,
  findByIdWithSlots,
};
