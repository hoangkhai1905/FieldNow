const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createBookingSchema } = require('../validators/booking.validator');

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully (Status PENDING)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict (slot locked, taken, or overlaps an active booking)
 */
router.post('/', validate(createBookingSchema), bookingController.createBooking);

/**
 * @swagger
 * /bookings/me:
 *   get:
 *     summary: Get all bookings for the current user
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *       401:
 *         description: Unauthorized
 */
router.get('/me', bookingController.getMyBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking detail
 *     tags: [Booking]
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
 *         description: Booking details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not owner of booking)
 *       404:
 *         description: Booking not found
 */
router.get('/:id', bookingController.getBookingDetail);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a pending booking
 *     tags: [Booking]
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
 *         description: Booking cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Conflict (Booking not in PENDING state)
 */
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;
