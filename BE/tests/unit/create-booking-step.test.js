const CreateBookingStep = require('../../src/pipelines/booking/create-booking.step');
const { errors } = require('../../src/utils/errors');

describe('CreateBookingStep', () => {
  it('rejects booking when the exact owner slot is locked', async () => {
    const step = new CreateBookingStep();
    const tx = { payment: { create: jest.fn() } };
    const ctx = {
      prisma: {
        $transaction: jest.fn((callback) => callback(tx)),
      },
      fieldRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'field-1', price_per_hour: 100000 }),
      },
      slotRepository: {
        findExact: jest.fn().mockResolvedValue({ id: 'slot-1', is_locked: true }),
      },
      bookingRepository: {
        createBooking: jest.fn(),
      },
      normalizeBookingSlot: jest.fn((booking) => booking),
      errors,
      fieldId: 'field-1',
      userId: 'user-1',
      date: '2024-01-01',
      reqStart: new Date('1970-01-01T18:00:00Z'),
      reqEnd: new Date('1970-01-01T19:00:00Z'),
    };

    await expect(step.execute(ctx)).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: 'Khung giờ này đang bị khóa bởi chủ sân',
    });
    expect(ctx.bookingRepository.createBooking).not.toHaveBeenCalled();
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it('maps database overlap constraint failures to a booking conflict', async () => {
    const step = new CreateBookingStep();
    const constraintError = new Error('constraint failed');
    constraintError.meta = { database_error: 'violates exclusion constraint "Booking_no_active_overlap"' };

    const ctx = {
      prisma: {
        $transaction: jest.fn().mockRejectedValue(constraintError),
      },
      errors,
    };

    await expect(step.execute(ctx)).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: 'Khung giờ này đã có người đặt hoặc bị trùng với lịch khác',
    });
  });
});
