const fieldRepository = require('../repositories/field.repository');
const bookingRepository = require('../repositories/booking.repository');
const cacheService = require('./cache.service');
const { logger } = require('../infrastructure/logger');
const { errors } = require('../utils/errors');

/**
 * Field service — business logic for field management.
 */

const createField = async (ownerId, data) => {
  const field = await fieldRepository.create({
    owner_id: ownerId,
    name: data.name,
    location: data.location,
    description: data.description || null,
    images: data.images || [],
    price_per_hour: data.pricePerHour,
    type: data.type,
    is_active: false, // Fields require admin approval
  });

  return field;
};

const updateField = async (fieldId, ownerId, data) => {
  const field = await fieldRepository.findById(fieldId);
  if (!field) {
    throw errors.notFound('Field');
  }
  if (field.owner_id !== ownerId) {
    throw errors.forbidden('You do not own this field');
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.pricePerHour !== undefined) updateData.price_per_hour = data.pricePerHour;
  if (data.type !== undefined) updateData.type = data.type;

  const updatedField = await fieldRepository.update(fieldId, updateData);
  await cacheService.invalidate('fields:search:*');
  await cacheService.invalidate(`fields:detail:${fieldId}:*`);
  return updatedField;
};

const getOwnerFields = async (ownerId) => {
  return fieldRepository.findByOwner(ownerId);
};

const getFieldById = async (fieldId) => {
  const field = await fieldRepository.findById(fieldId);
  if (!field) {
    throw errors.notFound('Field');
  }
  return field;
};

const searchFields = async (filters) => {
  const cacheKey = cacheService.hashKey('fields:search', filters);
  const cached = await cacheService.get(cacheKey);
  if (cached) return { result: cached, cacheHit: true };

  const result = await fieldRepository.findPublicWithFilters(filters);
  await cacheService.set(cacheKey, result, 300);
  return { result, cacheHit: false };
};

const getFieldWithSlots = async (fieldId, date) => {
  const cacheKey = `fields:detail:${fieldId}:date:${date || 'all'}`;
  let field = await cacheService.get(cacheKey);
  const cacheHit = !!field;

  if (cacheHit) {
    logger.info({ cacheKey }, '[Cache] Field detail HIT');
  } else {
    logger.info({ cacheKey }, '[Cache] Field detail MISS');
    field = await fieldRepository.findByIdWithSlots(fieldId, date);
    if (!field) {
      throw errors.notFound('Field');
    }
    await cacheService.set(cacheKey, field, 600);
  }

  const bookedIntervals = await bookingRepository.findActiveIntervals(fieldId, date);
  return {
    field: { ...field, bookedIntervals },
    cacheHit,
  };
};

// --- Admin actions ---
const approveField = async (fieldId) => {
  const field = await fieldRepository.findById(fieldId);
  if (!field) {
    throw errors.notFound('Field');
  }
  return fieldRepository.update(fieldId, { is_active: true });
};

const rejectField = async (fieldId) => {
  const field = await fieldRepository.findById(fieldId);
  if (!field) {
    throw errors.notFound('Field');
  }
  return fieldRepository.update(fieldId, { is_active: false });
};

module.exports = {
  createField,
  updateField,
  getOwnerFields,
  getFieldById,
  searchFields,
  getFieldWithSlots,
  approveField,
  rejectField,
};
