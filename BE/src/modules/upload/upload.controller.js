const uploadService = require('./upload.service');

const uploadFieldImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No files uploaded' },
      });
    }

    const uploadPromises = req.files.map((file) =>
      uploadService.uploadImage(file, req.user.userId)
    );

    const urls = await Promise.all(uploadPromises);

    res.status(200).json({ success: true, data: { urls } });
  } catch (error) {
    next(error);
  }
};

const deleteFieldImage = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'url is required' },
      });
    }
    await uploadService.deleteImage(url);
    res.status(200).json({ success: true, data: { message: 'Image deleted' } });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFieldImages, deleteFieldImage };
