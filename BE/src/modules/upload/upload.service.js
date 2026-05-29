const supabase = require('../../infrastructure/supabase');
const config = require('../../config/index');
const { errors } = require('../../common/utils/errors');
const { logger } = require('../../infrastructure/logger');

const BUCKET = config.supabase.bucket;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Uploads a single image buffer to Supabase Storage.
 * @param {object} file - Multer file object (buffer, mimetype, originalname)
 * @param {string} uploaderId - userId for namespacing
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadImage = async (file, uploaderId) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw errors.validation(
      `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP.`
    );
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw errors.validation(
      `File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`
    );
  }

  // Build a unique, namespaced path: fields/{userId}/{timestamp}-{originalname}
  const ext = file.originalname.split('.').pop().toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `fields/${uploaderId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    logger.error({ err: error, path: storagePath }, '[Upload] Supabase storage upload failed');
    throw errors.internal('Failed to upload image');
  }

  // Get the public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  logger.info({ path: storagePath, uploaderId }, '[Upload] Image uploaded successfully');

  return data.publicUrl;
};

/**
 * Deletes an image from Supabase Storage by its public URL.
 * @param {string} publicUrl - The public URL of the file to delete
 */
const deleteImage = async (publicUrl) => {
  // Extract the storage path from the public URL
  // URL format: {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}
  const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(bucketPrefix);
  if (idx === -1) {
    throw errors.validation('Invalid Supabase Storage URL');
  }
  const storagePath = publicUrl.slice(idx + bucketPrefix.length);

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) {
    logger.error({ err: error, path: storagePath }, '[Upload] Failed to delete image');
    throw errors.internal('Failed to delete image');
  }

  logger.info({ path: storagePath }, '[Upload] Image deleted successfully');
};

module.exports = { uploadImage, deleteImage };
