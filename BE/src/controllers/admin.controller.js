const prisma = require('../infrastructure/prisma');
const { errors } = require('../utils/errors');
const { logger } = require('../infrastructure/logger');
const { buildPagination, parsePagination } = require('../utils/pagination');

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { limit: 10, maxLimit: 100 });
    const { search, role } = req.query;
    const roleFilter = ['USER', 'OWNER', 'ADMIN'].includes(role) ? role : undefined;
    const where = {};

    if (roleFilter) {
      where.role = roleFilter;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { full_name: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          phone_number: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['role'],
        where,
        _count: { role: true },
      }),
    ]);

    const summary = roleCounts.reduce(
      (acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      },
      { USER: 0, OWNER: 0, ADMIN: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: buildPagination({ page, limit, total }),
        summary: {
          ...summary,
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'OWNER', 'ADMIN'].includes(role)) {
      throw errors.validation('Invalid role');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw errors.notFound('User');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    logger.info({ action: 'ADMIN_UPDATE_ROLE', adminId: req.user.userId, targetUserId: id, newRole: role }, `Admin updated user ${id} role to ${role}`);

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUserRole,
};
