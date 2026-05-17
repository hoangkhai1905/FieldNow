const express = require('express');
const fieldController = require('../controllers/field.controller');
const adminController = require('../controllers/admin.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { roleMiddleware } = require('../middlewares/role.middleware');

const router = express.Router();

// Authenticate all routes in this router
router.use(authMiddleware);

/**
 * Field management routes - strictly restricted to ADMIN role only
 */
router.get('/fields', roleMiddleware(['ADMIN']), fieldController.getAdminFields);

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
router.patch('/fields/:id/approve', roleMiddleware(['ADMIN']), fieldController.approveField);

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
router.patch('/fields/:id/reject', roleMiddleware(['ADMIN']), fieldController.rejectField);

/**
 * User management routes - accessible to both OWNER and ADMIN (merged design)
 */

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
router.get('/users', roleMiddleware(['OWNER', 'ADMIN']), adminController.getUsers);

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
router.patch('/users/:id/role', roleMiddleware(['OWNER', 'ADMIN']), adminController.updateUserRole);

module.exports = router;
