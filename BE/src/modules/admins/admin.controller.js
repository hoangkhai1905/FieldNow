const prisma = require('../../infrastructure/prisma');
const { errors } = require('../../common/utils/errors');
const { logger } = require('../../infrastructure/logger');
const { buildPagination, parsePagination } = require('../../common/utils/pagination');
const paymentService = require('../payments/payment.service');

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { limit: 10, maxLimit: 100 });
    const { search, role, status } = req.query;
    const roleFilter = ['USER', 'OWNER', 'ADMIN'].includes(role) ? role : undefined;
    const statusFilter = ['active', 'locked'].includes(status) ? status : undefined;
    const where = {};

    if (roleFilter) {
      where.role = roleFilter;
    }

    if (statusFilter) {
      where.is_active = statusFilter === 'active';
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
          is_active: true,
          deactivated_at: true,
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

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      userCounts,
      totalFields,
      activeFields,
      pendingFields,
      totalBookings,
      todayBookings,
      bookingStatusCounts,
      completedRevenue,
      pendingCashPayments,
      recentBookings,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.field.count(),
      prisma.field.count({ where: { is_active: true } }),
      prisma.field.count({ where: { is_active: false } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          created_at: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.count({
        where: {
          provider: { equals: 'cash', mode: 'insensitive' },
          status: 'PENDING',
        },
      }),
      prisma.booking.findMany({
        include: {
          user: {
            select: { full_name: true, email: true },
          },
          field: {
            select: { name: true, location: true },
          },
          payments: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        take: 6,
      }),
    ]);

    const users = userCounts.reduce(
      (acc, item) => {
        acc[item.role] = item._count.role;
        acc.total += item._count.role;
        return acc;
      },
      { USER: 0, OWNER: 0, ADMIN: 0, total: 0 }
    );

    const bookings = bookingStatusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      { PENDING: 0, CONFIRMED: 0, CANCELLED: 0, total: totalBookings, today: todayBookings }
    );

    res.status(200).json({
      success: true,
      data: {
        users,
        fields: {
          total: totalFields,
          active: activeFields,
          pending: pendingFields,
        },
        bookings,
        payments: {
          completedRevenue: Number(completedRevenue._sum.amount ?? 0),
          pendingCash: pendingCashPayments,
        },
        recentBookings,
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

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw errors.validation('isActive must be boolean');
    }

    if (id === req.user.userId && !isActive) {
      throw errors.conflict('Cannot deactivate your own account');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw errors.notFound('User');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        is_active: isActive,
        deactivated_at: isActive ? null : new Date(),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        role: true,
        is_active: true,
        deactivated_at: true,
        created_at: true,
      },
    });

    logger.info(
      { action: 'ADMIN_UPDATE_USER_STATUS', adminId: req.user.userId, targetUserId: id, isActive },
      `Admin ${isActive ? 'activated' : 'deactivated'} user ${id}`
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

const getCashPayments = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { limit: 10, maxLimit: 100 });
    const status = ['PENDING', 'COMPLETED'].includes(req.query.status) ? req.query.status : undefined;
    const where = {
      provider: { equals: 'cash', mode: 'insensitive' },
      ...(status ? { status } : {}),
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              user: {
                select: { id: true, email: true, full_name: true, phone_number: true },
              },
              field: {
                select: { id: true, name: true, location: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: buildPagination({ page, limit, total }),
      },
    });
  } catch (error) {
    next(error);
  }
};

const confirmCashPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.confirmCashPayment(req.params.bookingId, req.user.userId);
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getCashPayments,
  confirmCashPayment,
};
