jest.mock('../../src/infrastructure/prisma', () => ({
  user: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  field: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  booking: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  payment: {
    aggregate: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
}));

const prisma = require('../../src/infrastructure/prisma');
const chatbotContext = require('../../src/modules/chatbot/chatbot.context.service');

describe('Chatbot Context Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.field.findMany.mockResolvedValue([]);
    prisma.field.count.mockResolvedValue(0);
    prisma.field.groupBy.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    prisma.user.groupBy.mockResolvedValue([]);
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.count.mockResolvedValue(0);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.payment.count.mockResolvedValue(0);
    prisma.payment.findMany.mockResolvedValue([]);
  });

  it('parses 5k slang as max price without treating ko as a location', async () => {
    await chatbotContext.findPublicFields('có sân nào 5k ko?');

    expect(prisma.field.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          is_active: true,
          price_per_hour: { lte: 5000 },
        },
      })
    );
  });

  it('parses 5.000d and keeps location clean when price follows location', async () => {
    await chatbotContext.findPublicFields('có sân ở Hải Châu giá 5.000d/h không?');

    expect(prisma.field.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          is_active: true,
          location: { contains: 'Hải Châu', mode: 'insensitive' },
          price_per_hour: { lte: 5000 },
        },
      })
    );
  });

  it('does not mistake district number as a price', async () => {
    await chatbotContext.findPublicFields('tìm sân ở quận 1');

    expect(prisma.field.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          is_active: true,
          location: { contains: 'quận 1', mode: 'insensitive' },
        },
      })
    );
  });

  it('returns user booking summary counts for personal booking questions', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        field_id: 'field-1',
        date: new Date('2026-05-23'),
        start_time: new Date('1970-01-01T10:00:00.000Z'),
        end_time: new Date('1970-01-01T11:00:00.000Z'),
        status: 'CONFIRMED',
        total_price: 5000,
        field: {
          id: 'field-1',
          name: 'FieldNow Demo Tennis 20',
          location: 'Hải Châu, Đà Nẵng',
          type: 'TENNIS',
          price_per_hour: 5000,
          open_time: new Date('1970-01-01T06:00:00.000Z'),
          close_time: new Date('1970-01-01T22:00:00.000Z'),
          is_active: true,
        },
        payments: [],
      },
    ]);
    prisma.booking.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);

    const result = await chatbotContext.findUserBookings('user-1');

    expect(result.summary).toEqual({
      totalBookings: 3,
      pendingBookings: 1,
      confirmedBookings: 2,
      cancelledBookings: 0,
    });
    expect(result.bookings).toHaveLength(1);
  });

  it('scopes owner field searches to the owner fields by default', async () => {
    prisma.field.count.mockResolvedValue(5);
    prisma.field.groupBy.mockResolvedValue([{ type: 'TENNIS', _count: { _all: 5 } }]);

    const result = await chatbotContext.findPublicFields('tôi có bao nhiêu sân?', {
      userId: 'owner-1',
      role: 'OWNER',
    });

    expect(prisma.field.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { owner_id: 'owner-1' },
      })
    );
    expect(prisma.field.count).toHaveBeenCalledWith({ where: { owner_id: 'owner-1' } });
    expect(result.fieldScope).toBe('owner_fields');
    expect(result.summary).toEqual({
      totalFields: 5,
      typeCounts: [{ type: 'TENNIS', count: 5 }],
    });
  });

  it('returns owner field type summary for owner type questions', async () => {
    prisma.field.count.mockResolvedValue(5);
    prisma.field.groupBy.mockResolvedValue([{ type: 'TENNIS', _count: { _all: 5 } }]);

    const result = await chatbotContext.findFieldTypes('có các loại sân nào?', {
      userId: 'owner-1',
      role: 'OWNER',
    });

    expect(prisma.field.groupBy).toHaveBeenCalledWith({
      by: ['type'],
      where: { owner_id: 'owner-1' },
      _count: { _all: true },
      orderBy: { type: 'asc' },
    });
    expect(result.fieldScope).toBe('owner_fields');
    expect(result.summary.typeCounts).toEqual([{ type: 'TENNIS', count: 5 }]);
  });

  it('returns paid booking summary excluding cancelled bookings', async () => {
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    const result = await chatbotContext.findUserPaymentStatus('user-1');

    expect(prisma.booking.count).toHaveBeenNthCalledWith(5, {
      where: {
        user_id: 'user-1',
        status: { not: 'CANCELLED' },
        payments: { some: { status: 'COMPLETED' } },
      },
    });
    expect(prisma.payment.aggregate).toHaveBeenCalledWith({
      where: {
        status: 'COMPLETED',
        booking: {
          user_id: 'user-1',
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { amount: true },
    });
    expect(result.summary.paidBookings).toBe(0);
    expect(result.summary.paidAmount).toBe(0);
  });

  it('returns owner monthly revenue from completed payments on owner fields', async () => {
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.field.findMany.mockResolvedValue([]);
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.payment.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 5000 } })
      .mockResolvedValueOnce({ _sum: { amount: 5000 } });
    prisma.payment.count.mockResolvedValueOnce(1);

    const result = await chatbotContext.findOwnerInsights('owner-1', 'tổng doanh thu tháng này là bao nhiêu?');

    expect(prisma.payment.aggregate).toHaveBeenNthCalledWith(1, {
      where: {
        status: 'COMPLETED',
        booking: { field: { owner_id: 'owner-1' } },
        created_at: {
          gte: expect.any(Date),
          lt: expect.any(Date),
        },
      },
      _sum: { amount: true },
    });
    expect(prisma.payment.count).toHaveBeenCalledWith({
      where: {
        status: 'COMPLETED',
        booking: { field: { owner_id: 'owner-1' } },
        created_at: {
          gte: expect.any(Date),
          lt: expect.any(Date),
        },
      },
    });
    expect(result.summary.monthlyRevenue).toBe(5000);
    expect(result.summary.monthlyCompletedPayments).toBe(1);
    expect(result.summary.totalRevenue).toBe(5000);
  });

  it('omits customer PII from owner booking context', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        user_id: 'user-1',
        field_id: 'field-1',
        date: new Date('2026-05-23'),
        start_time: new Date('1970-01-01T10:00:00.000Z'),
        end_time: new Date('1970-01-01T11:00:00.000Z'),
        status: 'CONFIRMED',
        total_price: 5000,
        field: {
          id: 'field-1',
          name: 'FieldNow Demo Tennis 20',
          location: 'Hải Châu, Đà Nẵng',
          type: 'TENNIS',
          price_per_hour: 5000,
          open_time: new Date('1970-01-01T06:00:00.000Z'),
          close_time: new Date('1970-01-01T22:00:00.000Z'),
          is_active: true,
        },
        payments: [],
        user: {
          full_name: 'Sensitive Name',
          phone_number: '0901234567',
        },
      },
    ]);
    prisma.field.findMany.mockResolvedValue([]);

    const result = await chatbotContext.findOwnerSchedule('owner-1', 'lịch đặt sân');

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          field: { owner_id: 'owner-1' },
        },
        include: {
          field: true,
          payments: { orderBy: { created_at: 'desc' }, take: 1 },
        },
      })
    );
    expect(prisma.booking.findMany.mock.calls[0][0].include.user).toBeUndefined();
    expect(result.bookings[0].customer).toEqual({ id: 'user-1' });
    expect(result.bookings[0].customer.fullName).toBeUndefined();
    expect(result.bookings[0].customer.phoneNumber).toBeUndefined();
  });

  it('returns admin system-wide read-only metrics', async () => {
    prisma.user.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2);
    prisma.user.groupBy.mockResolvedValue([
      { role: 'ADMIN', _count: { _all: 1 } },
      { role: 'OWNER', _count: { _all: 4 } },
      { role: 'USER', _count: { _all: 7 } },
    ]);
    prisma.field.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(18)
      .mockResolvedValueOnce(2);
    prisma.field.groupBy.mockResolvedValue([{ type: 'TENNIS', _count: { _all: 5 } }]);
    prisma.booking.count
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3);
    prisma.payment.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    prisma.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 5000 } });

    const result = await chatbotContext.findAdminInsights('tổng quan hệ thống hiện tại?');

    expect(result.summary).toEqual(
      expect.objectContaining({
        monthlyRevenue: 5000,
        totalUsers: 12,
        activeUsers: 10,
        inactiveUsers: 2,
        totalFields: 20,
        activeFields: 18,
        inactiveFields: 2,
        totalBookings: 9,
        pendingBookings: 2,
        confirmedBookings: 4,
        cancelledBookings: 3,
        completedPayments: 6,
        pendingPayments: 1,
        failedPayments: 2,
        expiredPayments: 0,
      })
    );
    expect(result.summary.roleCounts).toEqual([
      { role: 'ADMIN', count: 1 },
      { role: 'OWNER', count: 4 },
      { role: 'USER', count: 7 },
    ]);
  });
});
