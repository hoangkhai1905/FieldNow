const slotService = require('../../src/services/slot.service');
const slotRepository = require('../../src/repositories/slot.repository');
const fieldRepository = require('../../src/repositories/field.repository');
const { errors } = require('../../src/utils/errors');

jest.mock('../../src/repositories/slot.repository');
jest.mock('../../src/repositories/field.repository');

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
  });
});
