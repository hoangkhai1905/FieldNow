const prisma = require('../infrastructure/prisma');
const { errors } = require('../utils/errors');
const { logger } = require('../infrastructure/logger');

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        phone_number: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json({ success: true, data: users });
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
