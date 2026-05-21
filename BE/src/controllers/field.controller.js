const fieldService = require('../services/field.service');
const { logger } = require('../infrastructure/logger');
const { parsePagination } = require('../utils/pagination');

const createField = async (req, res, next) => {
  try {
    const field = await fieldService.createField(req.user.userId, req.body);
    res.status(201).json({ success: true, data: field });
  } catch (error) {
    next(error);
  }
};

const updateField = async (req, res, next) => {
  try {
    const field = await fieldService.updateField(req.params.id, req.user.userId, req.body);
    res.status(200).json({ success: true, data: field });
  } catch (error) {
    next(error);
  }
};

const getOwnerFields = async (req, res, next) => {
  try {
    const result = await fieldService.getOwnerFields(
      req.user.userId,
      parsePagination(req.query, { limit: 8, maxLimit: 100 })
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// --- Public ---
const searchFields = async (req, res, next) => {
  try {
    const { location, minPrice, maxPrice, page, limit, type, sortBy, sortOrder } = req.query;
    const { result, cacheHit } = await fieldService.searchFields({
      location,
      type,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy,
      sortOrder,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
    res.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getFieldDetail = async (req, res, next) => {
  try {
    const { field, cacheHit } = await fieldService.getFieldWithSlots(req.params.id, req.query.date);
    res.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.status(200).json({ success: true, data: field });
  } catch (error) {
    next(error);
  }
};

// --- Admin ---
const getAdminFields = async (req, res, next) => {
  try {
    const result = await fieldService.getAdminFields({
      ...parsePagination(req.query, { limit: 10, maxLimit: 100 }),
      status: req.query.status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const approveField = async (req, res, next) => {
  try {
    const field = await fieldService.approveField(req.params.id);
    logger.info({ action: 'ADMIN_APPROVE_FIELD', adminId: req.user.userId, fieldId: field.id }, `Admin approved field ${field.id}`);
    res.status(200).json({ success: true, data: { message: 'Field approved', field } });
  } catch (error) {
    next(error);
  }
};

const rejectField = async (req, res, next) => {
  try {
    const field = await fieldService.rejectField(req.params.id);
    logger.info({ action: 'ADMIN_REJECT_FIELD', adminId: req.user.userId, fieldId: field.id }, `Admin rejected field ${field.id}`);
    res.status(200).json({ success: true, data: { message: 'Field rejected', field } });
  } catch (error) {
    next(error);
  }
};

const getFieldTypes = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      types: ['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS'],
    },
  });
};

module.exports = {
  createField,
  updateField,
  getOwnerFields,
  searchFields,
  getFieldDetail,
  getFieldTypes,
  getAdminFields,
  approveField,
  rejectField,
};
