const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { z } = require('zod');

const router = express.Router();

const initiatePaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  provider: z.string().optional(),
});

// --- Public Routes (no auth) ---

/**
 * @swagger
 * /payments/sepay-ipn:
 *   post:
 *     summary: SePay IPN Webhook (server-to-server callback)
 *     description: >
 *       Called by SePay after each transaction. Verifies the X-Secret-Key header
 *       and updates the booking/payment status. Always returns HTTP 200.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notification_type:
 *                 type: string
 *                 example: ORDER_PAID
 *               order:
 *                 type: object
 *               transaction:
 *                 type: object
 *     responses:
 *       200:
 *         description: IPN acknowledged
 */
router.post('/sepay-ipn', paymentController.handleSepayIpn);

// --- Protected Routes ---
router.use(authMiddleware);

/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate payment for a booking
 *     description: >
 *       Creates a SePay checkout. Returns `checkoutUrl` and `formFields`.
 *       The frontend should build a hidden-field HTML form, POST it to `checkoutUrl`
 *       to redirect the user to the SePay payment page.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               provider:
 *                 type: string
 *                 enum: [sepay, cash]
 *                 default: sepay
 *     responses:
 *       200:
 *         description: SePay checkout URL and signed form fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkoutUrl:
 *                       type: string
 *                     formFields:
 *                       type: object
 *                     paymentId:
 *                       type: string
 */
router.post('/initiate', validate(initiatePaymentSchema), paymentController.initiatePayment);

/**
 * @swagger
 * /payments/{bookingId}:
 *   get:
 *     summary: Get payment details for a booking
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/:bookingId', paymentController.getPaymentDetail);

module.exports = router;
