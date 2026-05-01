const { processExpirationJob } = require('../../src/workers/expiration.worker');
const bookingRepository = require('../../src/repositories/booking.repository');
const { emailQueue } = require('../../src/infrastructure/queue');
const prisma = require('../../src/infrastructure/prisma');

jest.mock('../../src/infrastructure/prisma', () => ({
  $transaction: jest.fn((callback) => callback('mocked-tx')),
}));
jest.mock('../../src/repositories/booking.repository');
jest.mock('../../src/infrastructure/queue', () => ({
  emailQueue: {
    add: jest.fn(),
  },
  defaultQueueOptions: {},
}));
jest.mock('../../src/infrastructure/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Worker Idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Expiration Worker', () => {
    it('should cancel if booking is PENDING and expired', async () => {
      bookingRepository.findById.mockResolvedValue({
        id: 'booking-1',
        user_id: 'user-1',
        status: 'PENDING',
        expires_at: new Date(Date.now() - 10000), // Expired 10s ago
      });

      await processExpirationJob({
        data: { bookingId: 'booking-1', expectedStatus: 'PENDING' },
      });

      expect(bookingRepository.updateStatus).toHaveBeenCalledWith('booking-1', 'CANCELLED', 'mocked-tx');
      expect(emailQueue.add).toHaveBeenCalledWith('email.booking_cancelled', expect.any(Object));
    });

    it('should NOT cancel if booking is already CONFIRMED (idempotency)', async () => {
      bookingRepository.findById.mockResolvedValue({
        id: 'booking-1',
        user_id: 'user-1',
        status: 'CONFIRMED', // Already confirmed via payment
        expires_at: new Date(Date.now() - 10000),
      });

      await processExpirationJob({
        data: { bookingId: 'booking-1', expectedStatus: 'PENDING' },
      });

      expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('should NOT cancel if booking is already CANCELLED (idempotency)', async () => {
      bookingRepository.findById.mockResolvedValue({
        id: 'booking-1',
        user_id: 'user-1',
        status: 'CANCELLED', // Cancelled by user before expiration
        expires_at: new Date(Date.now() - 10000),
      });

      await processExpirationJob({
        data: { bookingId: 'booking-1', expectedStatus: 'PENDING' },
      });

      expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('should NOT cancel if expires_at is in the future', async () => {
      bookingRepository.findById.mockResolvedValue({
        id: 'booking-1',
        user_id: 'user-1',
        status: 'PENDING',
        expires_at: new Date(Date.now() + 10000), // Expires in 10s
      });

      await processExpirationJob({
        data: { bookingId: 'booking-1', expectedStatus: 'PENDING' },
      });

      expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
