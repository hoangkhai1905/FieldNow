const fieldService = require('../../src/modules/fields/field.service');
const fieldRepository = require('../../src/modules/fields/field.repository');
const { errors: _errors } = require('../../src/common/utils/errors');

jest.mock('../../src/modules/fields/field.repository');

describe('Field Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateField', () => {
    it('should update field if owner matches', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-1' });
      fieldRepository.update.mockResolvedValue({ id: 'field-1', name: 'Updated Name' });

      const result = await fieldService.updateField('field-1', 'owner-1', { name: 'Updated Name' });

      expect(fieldRepository.update).toHaveBeenCalledWith('field-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NOT_FOUND if field does not exist', async () => {
      fieldRepository.findById.mockResolvedValue(null);

      await expect(fieldService.updateField('nonexistent', 'owner-1', {})).rejects.toMatchObject({
        code: 'NOT_FOUND'
      });
    });

    it('should throw FORBIDDEN if owner does not match', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1', owner_id: 'owner-2' });

      await expect(fieldService.updateField('field-1', 'owner-1', {})).rejects.toMatchObject({
        code: 'FORBIDDEN'
      });
    });
  });

  describe('approveField', () => {
    it('should set is_active to true', async () => {
      fieldRepository.findById.mockResolvedValue({ id: 'field-1' });
      fieldRepository.update.mockResolvedValue({ id: 'field-1', is_active: true });

      const result = await fieldService.approveField('field-1');

      expect(fieldRepository.update).toHaveBeenCalledWith('field-1', { is_active: true });
      expect(result.is_active).toBe(true);
    });

    it('should throw NOT_FOUND if field does not exist', async () => {
      fieldRepository.findById.mockResolvedValue(null);

      await expect(fieldService.approveField('nonexistent')).rejects.toMatchObject({
        code: 'NOT_FOUND'
      });
    });
  });
});
