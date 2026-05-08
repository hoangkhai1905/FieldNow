const fieldRepository = require('../repositories/field.repository');
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

  return fieldRepository.update(fieldId, updateData);
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
  return fieldRepository.findPublicWithFilters(filters);
};

const getFieldWithSlots = async (fieldId, date) => {
  const field = await fieldRepository.findByIdWithSlots(fieldId, date);
  if (!field) {
    throw errors.notFound('Field');
  }
  return field;
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
