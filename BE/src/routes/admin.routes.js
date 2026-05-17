const express = require('express');
const fieldController = require('../controllers/field.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { roleMiddleware } = require('../middlewares/role.middleware');

const router = express.Router();

// All management routes require authentication and OWNER role (Admin and Owner merged)
router.use(authMiddleware, roleMiddleware(['OWNER', 'ADMIN']));

router.get('/fields', fieldController.getAdminFields);

/**
 * @swagger
 * /admin/fields/{id}/approve:
 *   patch:
 *     summary: Approve a field (make it active)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Field approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an ADMIN)
 *       404:
 *         description: Field not found
 */
router.patch('/fields/:id/approve', fieldController.approveField);

/**
 * @swagger
 * /admin/fields/{id}/reject:
 *   patch:
 *     summary: Reject a field (make it inactive)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Field rejected successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an ADMIN)
 *       404:
 *         description: Field not found
 */
router.patch('/fields/:id/reject', fieldController.rejectField);
const adminController = require('../controllers/admin.controller');

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', adminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update a user's role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, OWNER, ADMIN]
 *     responses:
 *       200:
 *         description: User role updated
 */
router.patch('/users/:id/role', adminController.updateUserRole);

module.exports = router;
