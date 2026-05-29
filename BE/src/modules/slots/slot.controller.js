const slotService = require('./slot.service');

const createSlot = async (req, res, next) => {
  try {
    const slot = await slotService.createSlot(req.params.fieldId, req.user.userId, req.body);
    res.status(201).json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

const batchCreateSlots = async (req, res, next) => {
  try {
    const result = await slotService.batchCreateSlots(req.params.fieldId, req.user.userId, req.body.slots);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const slot = await slotService.updateSlot(req.params.slotId, req.user.userId, req.body);
    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    await slotService.deleteSlot(req.params.slotId, req.user.userId);
    res.status(200).json({ success: true, data: { message: 'Slot deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

const getSlotsByFieldAndDate = async (req, res, next) => {
  try {
    const slots = await slotService.getSlotsByFieldAndDate(req.params.fieldId, req.query.date);
    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSlot,
  batchCreateSlots,
  updateSlot,
  deleteSlot,
  getSlotsByFieldAndDate,
};
