const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { z } = require('zod');

const router = express.Router();

const initiatePaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
});

/**
 * @swagger
 * /payments/vnpay-ipn:
 *   get:
 *     summary: VNPay IPN Webhook
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: IPN Response
 */
router.get('/vnpay-ipn', paymentController.handleVNPayIpn);

/**
 * @swagger
 * /payments/vnpay-return:
 *   get:
 *     summary: VNPay Return URL (Redirect from VNPay)
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Return URL Response
 */
router.get('/vnpay-return', paymentController.handleVNPayReturn);

// --- Protected Routes ---
router.use(authMiddleware);

/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate payment for a booking
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
 *     responses:
 *       200:
 *         description: Payment URL generated
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
