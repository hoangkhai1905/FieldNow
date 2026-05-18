jest.mock('../../src/infrastructure/queue', () => ({
  bookingExpirationQueue: {
    add: jest.fn(),
    getJob: jest.fn(),
  },
  emailQueue: {
    add: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

const { bookingExpirationQueue, emailQueue } = require('../../src/infrastructure/queue');
const bookingSideEffects = require('../../src/services/booking-side-effect.service');

describe('BookingSideEffectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('schedules only the expiration job when a booking is created', async () => {
    await bookingSideEffects.scheduleBookingCreatedSideEffects({
      bookingId: 'booking-1',
      slotId: 'slot-1',
      userId: 'user-1',
      delayMs: 1000,
    });

    const expirationOptions = bookingExpirationQueue.add.mock.calls[0][2];

    expect(expirationOptions.jobId).toBe('booking-expire-booking-1');
    expect(expirationOptions.jobId).not.toContain(':');
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('schedules booking-cancelled email with a BullMQ-safe job id', async () => {
    await bookingSideEffects.scheduleBookingCancelledSideEffects({
      bookingId: 'booking-1',
      userId: 'user-1',
    });

    const cancelledEmailOptions = emailQueue.add.mock.calls[0][2];

    expect(cancelledEmailOptions.jobId).toBe('email-booking-cancelled-booking-1');
    expect(cancelledEmailOptions.jobId).not.toContain(':');
  });

  it('removes the booking expiration job when it exists', async () => {
    const remove = jest.fn().mockResolvedValue();
    bookingExpirationQueue.getJob.mockResolvedValue({ remove });

    const removed = await bookingSideEffects.removeBookingExpirationJob('booking-1');

    expect(bookingExpirationQueue.getJob).toHaveBeenCalledWith('booking-expire-booking-1');
    expect(remove).toHaveBeenCalled();
    expect(removed).toBe(true);
  });
});
