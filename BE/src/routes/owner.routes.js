const express = require('express');
const fieldController = require('../controllers/field.controller');
const slotController = require('../controllers/slot.controller');
const ownerController = require('../controllers/owner.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { roleMiddleware } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createFieldSchema, updateFieldSchema } = require('../validators/field.validator');
const { batchCreateSlotsSchema, updateSlotSchema } = require('../validators/slot.validator');

const router = express.Router();

// All owner routes require authentication and OWNER role
router.use(authMiddleware, roleMiddleware(['OWNER']));

/**
 * @swagger
 * /owner/fields:
 *   post:
 *     summary: Create a new field
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFieldRequest'
 *     responses:
 *       201:
 *         description: Field created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an OWNER)
 */
router.post('/fields', validate(createFieldSchema), fieldController.createField);

/**
 * @swagger
 * /owner/fields:
 *   get:
 *     summary: Get all fields owned by the current user
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of owned fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/fields', fieldController.getOwnerFields);
router.get('/fields/:id', fieldController.getFieldDetail);

/**
 * @swagger
 * /owner/fields/{id}:
 *   patch:
 *     summary: Update a field
 *     tags: [Owner]
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
 *             $ref: '#/components/schemas/UpdateFieldRequest'
 *     responses:
 *       200:
 *         description: Field updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: Field not found
 */
router.patch('/fields/:id', validate(updateFieldSchema), fieldController.updateField);

/**
 * @swagger
 * /owner/fields/{id}/toggle-status:
 *   patch:
 *     summary: Toggle field activation status
 *     tags: [Owner]
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
 *         description: Field status toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Field not found
 */
router.patch('/fields/:id/toggle-status', ownerController.toggleFieldStatus);

/**
 * @swagger
 * /owner/bookings:
 *   get:
 *     summary: Get all bookings for fields owned by the user
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for owned fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/bookings', ownerController.getOwnerBookings);

/**
 * @swagger
 * /owner/stats:
 *   get:
 *     summary: Get owner dashboard statistics
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner statistics (revenue, booking counts, etc.)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', ownerController.getOwnerStats);

/**
 * @swagger
 * /owner/fields/{fieldId}/slots/batch:
 *   post:
 *     summary: Batch create slots for a field
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchCreateSlotsRequest'
 *     responses:
 *       201:
 *         description: Slots created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: Field not found
 *       409:
 *         description: Slot overlap conflict
 */
router.get('/fields/:fieldId/slots', slotController.getSlotsByFieldAndDate);
router.post('/fields/:fieldId/slots/batch', validate(batchCreateSlotsSchema), slotController.batchCreateSlots);

/**
 * @swagger
 * /owner/slots/{slotId}:
 *   patch:
 *     summary: Update a slot
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSlotRequest'
 *     responses:
 *       200:
 *         description: Slot updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: Slot not found
 */
router.patch('/slots/:slotId', validate(updateSlotSchema), slotController.updateSlot);

/**
 * @swagger
 * /owner/slots/{slotId}:
 *   delete:
 *     summary: Delete a slot
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Slot deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: Slot not found
 */
router.delete('/slots/:slotId', slotController.deleteSlot);

module.exports = router;
