const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { bookingEventsQueue, bookingExpirationQueue, emailQueue } = require('../../src/infrastructure/queue');

describe('Booking Concurrency', () => {
  let user1Token, user2Token;
  let slotId;
  let ownerId;
  let fieldId;

  const timeAt = (hours, minutes) => new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));

  beforeAll(async () => {
    // Generate two distinct users for testing concurrency
    const existingUser = await prisma.user.findFirst({ where: { role: 'USER' } });
    const user1 = existingUser || await prisma.user.create({
      data: {
        email: `concurrent-user1-${Date.now()}@fieldnow.dev`,
        password: 'password123',
        full_name: 'Concurrent User 1',
        role: 'USER',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: `concurrent@fieldnow.dev`,
        password: 'password123',
        full_name: 'Concurrent User',
        role: 'USER',
      },
    });

    user1Token = jwt.sign({ userId: user1.id, role: user1.role, email: user1.email }, config.jwtSecret, { expiresIn: '1h' });
    user2Token = jwt.sign({ userId: user2.id, role: user2.role, email: user2.email }, config.jwtSecret, { expiresIn: '1h' });

    // Pick a slot to book or create one
    const slot = await prisma.fieldSlot.findFirst({ where: { is_locked: false } });
    if (slot) {
      slotId = slot.id;
    } else {
      const owner = await prisma.user.create({
        data: {
          email: `concurrent-owner-${Date.now()}@fieldnow.dev`,
          password: 'password123',
          role: 'OWNER',
        },
      });
      ownerId = owner.id;

      const field = await prisma.field.create({
        data: {
          owner_id: owner.id,
          name: 'Concurrency Field',
          location: 'Test',
          price_per_hour: 100000,
          is_active: true,
        },
      });
      fieldId = field.id;

      const newSlot = await prisma.fieldSlot.create({
        data: {
          field_id: field.id,
          date: new Date(Date.now() + 86400000),
          start_time: timeAt(9, 0),
          end_time: timeAt(10, 0),
          is_locked: false,
        },
      });
      slotId = newSlot.id;
    }
  });

  afterAll(async () => {
    // Clean up
    await prisma.booking.deleteMany({ where: { slot_id: slotId } });
    await prisma.user.deleteMany({ where: { email: { in: ['concurrent@fieldnow.dev'] } } });
    if (slotId) {
      await prisma.fieldSlot.deleteMany({ where: { id: slotId } });
    }
    if (fieldId) {
      await prisma.field.deleteMany({ where: { id: fieldId } });
    }
    if (ownerId) {
      await prisma.user.deleteMany({ where: { id: ownerId } });
    }
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
