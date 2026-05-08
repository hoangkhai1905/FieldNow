const express = require('express');
const fieldController = require('../controllers/field.controller');
const { publicSearchLimiter } = require('../middlewares/rate-limit.middleware');

const router = express.Router();

/**
 * @swagger
 * /fields:
 *   get:
 *     summary: Search for active fields
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per hour
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per hour
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of fields
 *       429:
 *         description: Too many requests
 */
router.get('/fields', publicSearchLimiter, fieldController.searchFields);

/**
 * @swagger
 * /field-types:
 *   get:
 *     summary: List available field types
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Field type list
 */
router.get('/field-types', fieldController.getFieldTypes);

/**
 * @swagger
 * /fields/{id}:
 *   get:
 *     summary: Get field details with optional slots
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional date filter for slots (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Field details including slots
 *       404:
 *         description: Field not found
 */
router.get('/fields/:id', fieldController.getFieldDetail);

module.exports = router;
