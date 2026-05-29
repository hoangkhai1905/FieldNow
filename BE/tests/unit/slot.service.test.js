const slotService = require('../../src/modules/slots/slot.service');
const slotRepository = require('../../src/modules/slots/slot.repository');
const fieldRepository = require('../../src/modules/fields/field.repository');
const bookingRepository = require('../../src/modules/bookings/booking.repository');
const { errors: _errors } = require('../../src/common/utils/errors');

jest.mock('../../src/modules/slots/slot.repository');
jest.mock('../../src/modules/fields/field.repository');
jest.mock('../../src/modules/bookings/booking.repository');

describe('Slot Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSlot', () => {
    it('should create slot if no overlap and owner matches', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });
      slotRepository.findByFieldAndDate.mockResolvedValue([
        { start_time: '18:00', end_time: '19:00' }
      ]);
      slotRepository.create.mockResolvedValue({ id: 'slot-1' });

      const result = await slotService.createSlot('field-1', 'owner-1', {
        date: '2023-10-10',
        startTime: '19:00',
        endTime: '20:00'
      });

      expect(slotRepository.create).toHaveBeenCalled();
      expect(result.id).toBe('slot-1');
    });

    it('should throw CONFLICT if slot overlaps', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });
      slotRepository.findByFieldAndDate.mockResolvedValue([
        { start_time: '18:00', end_time: '19:00' }
      ]);

      await expect(slotService.createSlot('field-1', 'owner-1', {
        date: '2023-10-10',
        startTime: '18:30',
        endTime: '19:30'
      })).rejects.toMatchObject({
        code: 'CONFLICT'
      });

      expect(slotRepository.create).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN if owner does not match', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-2' });

      await expect(slotService.createSlot('field-1', 'owner-1', {
        date: '2023-10-10',
        startTime: '18:30',
        endTime: '19:30'
      })).rejects.toMatchObject({
        code: 'FORBIDDEN'
      });
    });

    it('should throw VALIDATION_ERROR if start time is not before end time', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });

      await expect(slotService.createSlot('field-1', 'owner-1', {
        date: '2023-10-10',
        startTime: '20:00',
        endTime: '20:00'
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR'
      });

      expect(slotRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('batchCreateSlots', () => {
    it('should batch create slots if no overlap', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });
      slotRepository.findByFieldAndDate.mockResolvedValue([]);
      slotRepository.createMany.mockResolvedValue({ count: 2 });

      const result = await slotService.batchCreateSlots('field-1', 'owner-1', [
        { date: '2023-10-10', startTime: '18:00', endTime: '19:00' },
        { date: '2023-10-10', startTime: '19:00', endTime: '20:00' }
      ]);

      expect(slotRepository.createMany).toHaveBeenCalled();
      expect(slotRepository.createMany.mock.calls[0][0]).toEqual(expect.arrayContaining([
        expect.objectContaining({
          start_time: expect.any(Date),
          end_time: expect.any(Date),
        })
      ]));
      expect(result.count).toBe(2);
    });

    it('should throw CONFLICT if any slot overlaps internally', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });
      slotRepository.findByFieldAndDate.mockResolvedValue([]);

      await expect(slotService.batchCreateSlots('field-1', 'owner-1', [
        { date: '2023-10-10', startTime: '18:00', endTime: '19:00' },
        { date: '2023-10-10', startTime: '18:30', endTime: '19:30' }
      ])).rejects.toMatchObject({
        code: 'CONFLICT'
      });
    });

    it('should throw VALIDATION_ERROR if any batched slot has an invalid time range', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });

      await expect(slotService.batchCreateSlots('field-1', 'owner-1', [
        { date: '2023-10-10', startTime: '19:00', endTime: '18:00' }
      ])).rejects.toMatchObject({
        code: 'VALIDATION_ERROR'
      });

      expect(slotRepository.findByFieldAndDate).not.toHaveBeenCalled();
      expect(slotRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('updateSlot', () => {
    it('should reject updates that make the time range invalid', async () => {
      slotRepository.findById.mockResolvedValue({
        id: 'slot-1',
        field_id: 'field-1',
        start_time: '18:00',
        end_time: '19:00'
      });
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });

      await expect(slotService.updateSlot('slot-1', 'owner-1', {
        startTime: '20:00'
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR'
      });

      expect(slotRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteSlot', () => {
    it('should delete slot when there are no active bookings', async () => {
      slotRepository.findById.mockResolvedValue({ id: 'slot-1', field_id: 'field-1' });
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });
      bookingRepository.checkActiveBookingsForSlot.mockResolvedValue(null);
      slotRepository.deleteById.mockResolvedValue({ id: 'slot-1' });

      const result = await slotService.deleteSlot('slot-1', 'owner-1');

      expect(bookingRepository.checkActiveBookingsForSlot).toHaveBeenCalledWith('slot-1');
      expect(slotRepository.deleteById).toHaveBeenCalledWith('slot-1');
      expect(result.id).toBe('slot-1');
    });

    it('should throw CONFLICT when deleting slot with active bookings', async () => {
      slotRepository.findById.mockResolvedValue({ id: 'slot-1', field_id: 'field-1' });
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });
      bookingRepository.checkActiveBookingsForSlot.mockResolvedValue({ id: 'booking-1' });

      await expect(slotService.deleteSlot('slot-1', 'owner-1')).rejects.toMatchObject({
        code: 'CONFLICT'
      });

      expect(slotRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN before checking bookings if owner does not match', async () => {
      slotRepository.findById.mockResolvedValue({ id: 'slot-1', field_id: 'field-1' });
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-2' });

      await expect(slotService.deleteSlot('slot-1', 'owner-1')).rejects.toMatchObject({
        code: 'FORBIDDEN'
      });

      expect(bookingRepository.checkActiveBookingsForSlot).not.toHaveBeenCalled();
      expect(slotRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
