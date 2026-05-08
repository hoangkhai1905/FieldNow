const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { emailQueue } = require('../../src/infrastructure/queue');
const vnpayProvider = require('../../src/providers/vnpay.provider');

// Mock Queue
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock VNPay Verification
jest.spyOn(vnpayProvider, 'verifySignature').mockImplementation(() => true);
jest.spyOn(vnpayProvider, 'isSuccess').mockImplementation((params) => params['vnp_ResponseCode'] === '00');

const timeAt = (hours, minutes) => new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));

describe('Payment E2E Flow', () => {
  let userToken, userId, fieldId, slotId, bookingId;

  beforeAll(async () => {
    // 1. Create a user
    const user = await prisma.user.create({
      data: {
        email: 'payment_tester@test.com',
        password: 'hash',
        full_name: 'Payment Tester',
        role: 'USER',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId, role: user.role }, config.jwtSecret, { expiresIn: '1h' });

    // 2. Create owner and field
    const owner = await prisma.user.create({
      data: {
        email: 'payment_owner@test.com',
        password: 'hash',
        role: 'OWNER',
      },
    });

    const field = await prisma.field.create({
      data: {
        owner_id: owner.id,
        name: 'Payment Field',
        location: 'Test Loc',
        price_per_hour: 500000,
        is_active: true,
      },
    });
    fieldId = field.id;

    // 3. Create a slot
    const slot = await prisma.fieldSlot.create({
      data: {
        field_id: fieldId,
        date: new Date(Date.now() + 86400000), // tomorrow
        start_time: timeAt(18, 0),
        end_time: timeAt(19, 0),
        is_locked: false,
      },
    });
    slotId = slot.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { booking_id: bookingId } });
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.fieldSlot.deleteMany({ where: { id: slotId } });
    await prisma.field.deleteMany({ where: { id: fieldId } });
    await prisma.user.deleteMany({
      where: { email: { in: ['payment_tester@test.com', 'payment_owner@test.com'] } },
    });
    await prisma.$disconnect();
    jest.restoreAllMocks();
  });

  it('should complete full E2E flow: Book -> Initiate Payment -> VNPay IPN Confirm', async () => {
    // Step 1: Book the slot
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ slotId });
    
    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.status).toBe('PENDING');
    bookingId = bookRes.body.data.id;

    // Step 2: Initiate Payment
    const initRes = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId });
    
    expect(initRes.status).toBe(200);
    expect(initRes.body.data).toHaveProperty('paymentUrl');
    expect(initRes.body.data).toHaveProperty('paymentId');

    // Verify payment record in DB
    const payment = await prisma.payment.findUnique({ where: { id: initRes.body.data.paymentId } });
    expect(payment.status).toBe('PENDING');

    // Step 3: VNPay IPN Callback (Success)
    const ipnRes = await request(app)
      .get('/api/v1/payments/vnpay-ipn')
      .query({
        vnp_TxnRef: bookingId,
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'mocked_signature'
      });
    
    expect(ipnRes.status).toBe(200);
    expect(ipnRes.body.RspCode).toBe('00');

    // Verify DB states updated
    const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(updatedBooking.status).toBe('CONFIRMED');

    const updatedPayment = await prisma.payment.findFirst({ where: { booking_id: bookingId } });
    expect(updatedPayment.status).toBe('COMPLETED');
  });

  it('should reject payment initiation if booking is not PENDING', async () => {
    const initRes = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId });
    
    expect(initRes.status).toBe(409); // Conflict: Booking is already CONFIRMED
  });

  it('should handle VNPay IPN callback with failed payment code', async () => {
    // We need a fresh pending booking for this test
    const newSlot = await prisma.fieldSlot.create({
      data: {
        field_id: fieldId,
        date: new Date(Date.now() + 86400000), // tomorrow
        start_time: timeAt(20, 0),
        end_time: timeAt(21, 0),
        is_locked: false,
      },
    });

    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ slotId: newSlot.id });
    
    const newBookingId = bookRes.body.data.id;

    const initRes = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId: newBookingId });
    
    // VNPay IPN Callback (Failed payment - e.g. cancelled by user)
    const ipnRes = await request(app)
      .get('/api/v1/payments/vnpay-ipn')
      .query({
        vnp_TxnRef: newBookingId,
        vnp_ResponseCode: '24', // e.g. Transaction cancelled
        vnp_SecureHash: 'mocked_signature'
      });
    
    expect(ipnRes.status).toBe(200); // IPN always returns 200 HTTP

    // Verify DB states updated to FAILED
    const updatedPayment = await prisma.payment.findFirst({ where: { booking_id: newBookingId } });
    expect(updatedPayment.status).toBe('FAILED');
    
    // Clean up
    await prisma.payment.deleteMany({ where: { booking_id: newBookingId } });
    await prisma.booking.deleteMany({ where: { id: newBookingId } });
    await prisma.fieldSlot.deleteMany({ where: { id: newSlot.id } });
  });
});
