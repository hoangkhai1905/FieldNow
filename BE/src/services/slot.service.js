const slotRepository = require('../repositories/slot.repository');
const fieldRepository = require('../repositories/field.repository');
const { errors } = require('../utils/errors');

/**
 * Slot service — business logic for slot management.
 */

const toMinutes = (value) => {
  if (value instanceof Date) {
    return value.getUTCHours() * 60 + value.getUTCMinutes();
  }

  if (typeof value === 'string') {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  return NaN;
};

const toTimeDate = (value) => {
  if (value instanceof Date) return value;
  const [hours, minutes] = String(value).split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
};

/**
 * Verify that the requesting user owns the field.
 */
const verifyFieldOwnership = async (fieldId, ownerId) => {
  const field = await fieldRepository.findById(fieldId);
  if (!field) {
    throw errors.notFound('Field');
  }
  if (field.owner_id !== ownerId) {
    throw errors.forbidden('You do not own this field');
  }
  return field;
};

/**
 * Check if a new slot overlaps with existing slots on the same field+date.
 */
const checkOverlap = (existingSlots, startTime, endTime) => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  return existingSlots.some((slot) => {
    const slotStart = toMinutes(slot.start_time);
    const slotEnd = toMinutes(slot.end_time);
    // Overlap: new start < existing end AND new end > existing start
    return startMinutes < slotEnd && endMinutes > slotStart;
  });
};

const createSlot = async (fieldId, ownerId, data) => {
  await verifyFieldOwnership(fieldId, ownerId);

  // Check for overlap
  const existing = await slotRepository.findByFieldAndDate(fieldId, data.date);
  if (checkOverlap(existing, data.startTime, data.endTime)) {
    throw errors.conflict('Slot overlaps with an existing slot');
  }

  return slotRepository.create({
    field_id: fieldId,
    date: new Date(data.date),
    start_time: toTimeDate(data.startTime),
    end_time: toTimeDate(data.endTime),
    price_override: data.priceOverride || null,
  });
};

const batchCreateSlots = async (fieldId, ownerId, slots) => {
  await verifyFieldOwnership(fieldId, ownerId);

  // Group by date for overlap checking
  const slotsByDate = {};
  for (const slot of slots) {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  }

  // Check overlaps for each date
  for (const [date, dateSlots] of Object.entries(slotsByDate)) {
    const existing = await slotRepository.findByFieldAndDate(fieldId, date);
    
    // Convert existing slots to the same structure for comparison
    const allSlotsForDate = [...existing];
    
    for (const slot of dateSlots) {
      if (checkOverlap(allSlotsForDate, slot.startTime, slot.endTime)) {
        throw errors.conflict(
          `Slot ${slot.startTime}-${slot.endTime} on ${date} overlaps with an existing or another batched slot`
        );
      }
      // Add the valid new slot to the pool to check subsequent batched slots against it
      allSlotsForDate.push({
        start_time: toTimeDate(slot.startTime),
        end_time: toTimeDate(slot.endTime),
      });
    }
  }

  const data = slots.map((slot) => ({
    field_id: fieldId,
    date: new Date(slot.date),
    start_time: toTimeDate(slot.startTime),
    end_time: toTimeDate(slot.endTime),
    price_override: slot.priceOverride || null,
  }));

  const result = await slotRepository.createMany(data);
  return { count: result.count };
};

const updateSlot = async (slotId, ownerId, data) => {
  const slot = await slotRepository.findById(slotId);
  if (!slot) {
    throw errors.notFound('Slot');
  }
  await verifyFieldOwnership(slot.field_id, ownerId);

  const updateData = {};
  if (data.startTime !== undefined) updateData.start_time = toTimeDate(data.startTime);
  if (data.endTime !== undefined) updateData.end_time = toTimeDate(data.endTime);
  if (data.priceOverride !== undefined) updateData.price_override = data.priceOverride;
  if (data.isLocked !== undefined) updateData.is_locked = data.isLocked;

  return slotRepository.update(slotId, updateData);
};

const deleteSlot = async (slotId, ownerId) => {
  const slot = await slotRepository.findById(slotId);
  if (!slot) {
    throw errors.notFound('Slot');
  }
  await verifyFieldOwnership(slot.field_id, ownerId);

  return slotRepository.deleteById(slotId);
};

const getSlotsByFieldAndDate = async (fieldId, date) => {
  return slotRepository.findByFieldAndDate(fieldId, date);
};

module.exports = {
  createSlot,
  batchCreateSlots,
  updateSlot,
  deleteSlot,
  getSlotsByFieldAndDate,
};
