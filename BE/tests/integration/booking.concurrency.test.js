jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'), // Mock acquireLock success
      eval: jest.fn().mockResolvedValue(1),   // Mock releaseLock success
      quit: jest.fn(),
    };
  });
});

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { bookingEventsQueue, bookingExpirationQueue, emailQueue } = require('../../src/infrastructure/queue');

describe('Booking Concurrency', () => {
  let user1Token, user2Token;
  let slotId;

  beforeAll(async () => {
    // Generate two distinct users for testing concurrency
    const [user1, user2] = await Promise.all([
      prisma.user.findFirst({ where: { role: 'USER' } }),
      prisma.user.create({
        data: {
          email: 'concurrent@fieldnow.dev',
          password: 'password123',
          full_name: 'Concurrent User',
          role: 'USER',
        }
      })
    ]);

    user1Token = jwt.sign({ userId: user1.id, role: user1.role, email: user1.email }, config.jwtSecret, { expiresIn: '1h' });
    user2Token = jwt.sign({ userId: user2.id, role: user2.role, email: user2.email }, config.jwtSecret, { expiresIn: '1h' });

    // Pick a slot to book
    const slot = await prisma.fieldSlot.findFirst({ where: { is_locked: false } });
    slotId = slot.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.booking.deleteMany({ where: { slot_id: slotId } });
    await prisma.user.delete({ where: { email: 'concurrent@fieldnow.dev' } });
    await redisClient.quit();
    
    // Disconnect queues to allow Jest to exit
    await bookingEventsQueue.close();
    await bookingExpirationQueue.close();
    await emailQueue.close();
  });

  it('should prevent double booking of the same slot using Redis lock', async () => {
    // Both users try to book the exact same slot at the exact same time
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ slotId }),
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ slotId }),
    ]);

    const statuses = [res1.status, res2.status];

    // One should succeed (201), the other should hit the lock (409 Conflict)
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    const errorResponse = res1.status === 409 ? res1.body : res2.body;
    expect(errorResponse.error.code).toBe('CONFLICT');

    // Verify only 1 booking was created in the database
    const bookings = await prisma.booking.findMany({ where: { slot_id: slotId } });
    expect(bookings.length).toBe(1);
    expect(bookings[0].status).toBe('PENDING');
  });
});
