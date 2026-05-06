const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const userController = require('../controllers/user.controller');
const { updateProfileSchema, deactivateAccountSchema } = require('../validators/user.validator');

const router = express.Router();

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/profile', authMiddleware, validate(updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /users/deactivate:
 *   post:
 *     summary: Deactivate current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.post('/deactivate', authMiddleware, validate(deactivateAccountSchema), userController.deactivateAccount);

module.exports = router;
