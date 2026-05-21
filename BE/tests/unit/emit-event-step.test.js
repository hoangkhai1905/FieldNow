const EmitEventStep = require('../../src/pipelines/booking/emit-event.step');

describe('EmitEventStep', () => {
  it('awaits booking-created side effects when provided', async () => {
    const step = new EmitEventStep();
    const scheduleBookingCreatedSideEffects = jest.fn().mockResolvedValue();
    const emit = jest.fn();
    const ctx = {
      booking: {
        id: 'booking-1',
        slot_id: 'slot-1',
        expires_at: new Date(Date.now() + 60 * 1000),
      },
      userId: 'user-1',
      bookingSideEffects: {
        scheduleBookingCreatedSideEffects,
      },
      bookingEvents: {
        emit,
      },
    };

    await step.execute(ctx);

    expect(scheduleBookingCreatedSideEffects).toHaveBeenCalledWith({
      bookingId: 'booking-1',
      slotId: 'slot-1',
      userId: 'user-1',
      delayMs: expect.any(Number),
    });
    expect(emit).not.toHaveBeenCalled();
  });

  it('does not fail booking creation when scheduling side effects fails', async () => {
    const step = new EmitEventStep();
    const scheduleError = new Error('ERR max request limit exceeded');
    const scheduleBookingCreatedSideEffects = jest.fn().mockRejectedValue(scheduleError);
    const logger = { warn: jest.fn() };
    const ctx = {
      booking: {
        id: 'booking-1',
        slot_id: 'slot-1',
        expires_at: new Date(Date.now() + 60 * 1000),
      },
      userId: 'user-1',
      bookingSideEffects: {
        scheduleBookingCreatedSideEffects,
      },
      logger,
    };

    await expect(step.execute(ctx)).resolves.toBeUndefined();

    expect(scheduleBookingCreatedSideEffects).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      { err: scheduleError, bookingId: 'booking-1' },
      '[Booking] Failed to schedule booking expiration job'
    );
  });

  it('falls back to emitting BOOKING_CREATED when side effects are not injected', async () => {
    const step = new EmitEventStep();
    const emit = jest.fn();
    const ctx = {
      booking: {
        id: 'booking-1',
        slot_id: 'slot-1',
        expires_at: null,
      },
      userId: 'user-1',
      bookingEvents: {
        emit,
      },
    };

    await step.execute(ctx);

    expect(emit).toHaveBeenCalledWith('BOOKING_CREATED', {
      bookingId: 'booking-1',
      slotId: 'slot-1',
      userId: 'user-1',
      delayMs: undefined,
    });
  });
});
