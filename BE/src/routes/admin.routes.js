const express = require('express');
const fieldController = require('../controllers/field.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { roleMiddleware } = require('../middlewares/role.middleware');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware, roleMiddleware(['ADMIN']));

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

module.exports = router;
