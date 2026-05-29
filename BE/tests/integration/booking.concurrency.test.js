const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/index');

describe('Booking Concurrency', () => {
  let user1Token;
  let user2Token;
  let user1Id;
  let user2Id;
  let ownerId;
  let fieldId;

  const bookingDate = '2031-05-14';

  beforeAll(async () => {
    const suffix = Date.now();
    const [user1, user2, owner] = await Promise.all([
      prisma.user.create({
        data: {
          email: `concurrent-user1-${suffix}@fieldnow.dev`,
          password: 'password123',
          full_name: 'Concurrent User 1',
          role: 'USER',
          is_email_verified: true,
        },
      }),
      prisma.user.create({
        data: {
          email: `concurrent-user2-${suffix}@fieldnow.dev`,
          password: 'password123',
          full_name: 'Concurrent User 2',
          role: 'USER',
          is_email_verified: true,
        },
      }),
      prisma.user.create({
        data: {
          email: `concurrent-owner-${suffix}@fieldnow.dev`,
          password: 'password123',
          role: 'OWNER',
          is_email_verified: true,
        },
      }),
    ]);

    user1Id = user1.id;
    user2Id = user2.id;
    ownerId = owner.id;
    user1Token = jwt.sign({ userId: user1.id, role: user1.role, email: user1.email }, config.jwtSecret, { expiresIn: '1h' });
    user2Token = jwt.sign({ userId: user2.id, role: user2.role, email: user2.email }, config.jwtSecret, { expiresIn: '1h' });

    const field = await prisma.field.create({
      data: {
        owner_id: owner.id,
        name: `Concurrency Field ${suffix}`,
        location: 'Test',
        price_per_hour: 100000,
        is_active: true,
      },
    });
    fieldId = field.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { booking: { field_id: fieldId } } });
    await prisma.booking.deleteMany({ where: { field_id: fieldId } });
    await prisma.field.deleteMany({ where: { id: fieldId } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id, ownerId] } } });
    await prisma.$disconnect();
  });

  it('prevents concurrent overlapping bookings for the same field interval', async () => {
    const payload = {
      fieldId,
      date: bookingDate,
      startTime: '09:00',
      endTime: '10:00',
    };

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(payload),
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(payload),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    const bookings = await prisma.booking.findMany({
      where: {
        field_id: fieldId,
        date: new Date(bookingDate),
        start_time: new Date('1970-01-01T09:00:00Z'),
        end_time: new Date('1970-01-01T10:00:00Z'),
      },
    });
    expect(bookings).toHaveLength(1);
    expect(bookings[0].status).toBe('PENDING');
  });

  it('maps sequential overlap attempts to a 409 conflict', async () => {
    const first = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        fieldId,
        date: bookingDate,
        startTime: '11:00',
        endTime: '12:00',
      });

    expect(first.status).toBe(201);

    const overlap = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        fieldId,
        date: bookingDate,
        startTime: '11:30',
        endTime: '12:30',
      });

    expect(overlap.status).toBe(409);
    expect(overlap.body.error.code).toBe('CONFLICT');
  });
});
