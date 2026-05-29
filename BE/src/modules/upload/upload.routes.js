const express = require('express');
const multer = require('multer');
const uploadController = require('./upload.controller');
const { authMiddleware } = require('../../common/middlewares/auth.middleware');
const { roleMiddleware } = require('../../common/middlewares/role.middleware');

const router = express.Router();

// Multer memory storage — files stored in RAM buffer, not on disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10,                  // Max 10 files per request
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  },
});

// All upload routes require authentication and OWNER or ADMIN role
router.use(authMiddleware, roleMiddleware(['OWNER', 'ADMIN']));

/**
 * @swagger
 * /upload/images:
 *   post:
 *     summary: Upload one or more field images to Supabase Storage
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files (JPEG, PNG, or WEBP). Max 10 files, 5MB each.
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No files or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only OWNER or ADMIN)
 */
router.post('/images', upload.array('images', 10), uploadController.uploadFieldImages);

/**
 * @swagger
 * /upload/images:
 *   delete:
 *     summary: Delete a field image from Supabase Storage
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: The public URL of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       400:
 *         description: Missing or invalid URL
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/images', uploadController.deleteFieldImage);

module.exports = router;
