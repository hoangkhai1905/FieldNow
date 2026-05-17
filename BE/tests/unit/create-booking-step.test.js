const CreateBookingStep = require('../../src/pipelines/booking/create-booking.step');
const { errors } = require('../../src/utils/errors');

describe('CreateBookingStep', () => {
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
