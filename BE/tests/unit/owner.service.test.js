const ownerService = require('../../src/services/owner.service');
const prisma = require('../../src/infrastructure/prisma');

jest.mock('../../src/infrastructure/prisma', () => ({
  field: {
    findMany: jest.fn(),
  },
}));

describe('Owner Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOwnerStats', () => {
    it('should calculate owner field, booking, and revenue stats', async () => {
      prisma.field.findMany.mockResolvedValue([
        {
          is_active: true,
          bookings: [
            {
              payments: [
                { amount: { toString: () => '100000' } },
                { amount: { toString: () => '50000' } },
              ],
            },
          ],
        },
        {
          is_active: false,
          bookings: [
            {
              payments: [
                { amount: { toString: () => '200000' } },
              ],
            },
          ],
        },
      ]);

      const result = await ownerService.getOwnerStats('owner-1');

      expect(prisma.field.findMany).toHaveBeenCalledWith({
        where: { owner_id: 'owner-1' },
        include: {
          bookings: {
            where: { status: 'CONFIRMED' },
            include: { payments: { where: { status: 'COMPLETED' } } },
          },
        },
      });
      expect(result).toEqual({
        totalFields: 2,
        activeFields: 1,
        totalConfirmedBookings: 2,
        totalRevenue: 350000,
      });
    });
  });
});
