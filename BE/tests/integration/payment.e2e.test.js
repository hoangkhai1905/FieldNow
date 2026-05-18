const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const sepayProvider = require('../../src/providers/sepay.provider');
const { emailQueue } = require('../../src/infrastructure/queue');

jest.spyOn(sepayProvider, 'createCheckoutFields').mockImplementation(() => ({
  checkoutUrl: 'https://checkout.test/fieldnow',
  formFields: { signed: 'yes' },
}));
jest.spyOn(sepayProvider, 'verifyIpn').mockImplementation(() => true);
jest.spyOn(sepayProvider, 'isSuccess').mockImplementation((body) => body?.order?.order_status === 'CAPTURED');
jest.spyOn(sepayProvider, 'extractBookingId').mockImplementation((body) => body?.order?.order_invoice_number);

describe('Payment E2E Flow', () => {
  let userToken;
  let ownerToken;
  let userId;
  let ownerId;
  let fieldId;
  const bookingIds = [];
  const bookingDate = '2031-05-15';

  const createBooking = async (startTime, endTime) => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ fieldId, date: bookingDate, startTime, endTime });

    expect(res.status).toBe(201);
    bookingIds.push(res.body.data.id);
    return res.body.data.id;
  };

  const postSepayIpn = (bookingId, success) => {
    return request(app)
      .post('/api/v1/payments/sepay-ipn')
      .send({
        notification_type: 'ORDER_PAID',
        order: {
          order_invoice_number: bookingId,
          order_status: success ? 'CAPTURED' : 'FAILED',
        },
        transaction: {
          transaction_status: success ? 'APPROVED' : 'DECLINED',
        },
      });
  };

  beforeAll(async () => {
    const suffix = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `payment-user-${suffix}@fieldnow.dev`,
        password: 'hash',
        full_name: 'Payment Tester',
        role: 'USER',
        is_email_verified: true,
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId, role: user.role, email: user.email }, config.jwtSecret, { expiresIn: '1h' });

    const owner = await prisma.user.create({
      data: {
        email: `payment-owner-${suffix}@fieldnow.dev`,
        password: 'hash',
        role: 'OWNER',
        is_email_verified: true,
      },
    });
    ownerId = owner.id;
    ownerToken = jwt.sign({ userId: owner.id, role: owner.role, email: owner.email }, config.jwtSecret, { expiresIn: '1h' });

    const field = await prisma.field.create({
      data: {
        owner_id: owner.id,
        name: `Payment Field ${suffix}`,
        location: 'Test Loc',
        price_per_hour: 500000,
        is_active: true,
      },
    });
    fieldId = field.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { booking_id: { in: bookingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.field.deleteMany({ where: { id: fieldId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, ownerId] } } });
    await prisma.$disconnect();
    jest.restoreAllMocks();
  });

  it('completes book -> initiate payment -> SePay IPN confirmation', async () => {
    const bookingId = await createBooking('18:00', '19:00');
    emailQueue.add.mockClear();

    const initRes = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId, provider: 'sepay' });

    expect(initRes.status).toBe(200);
    expect(initRes.body.data).toHaveProperty('checkoutUrl');
    expect(initRes.body.data).toHaveProperty('paymentId');
    expect(emailQueue.add).not.toHaveBeenCalledWith(
      'email.booking_confirmed',
      expect.any(Object),
      expect.any(Object)
    );

    const ipnRes = await postSepayIpn(bookingId, true);
    expect(ipnRes.status).toBe(200);
    expect(ipnRes.body.success).toBe(true);

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking.status).toBe('CONFIRMED');

    const payment = await prisma.payment.findFirst({ where: { booking_id: bookingId }, orderBy: { created_at: 'desc' } });
    expect(payment.status).toBe('COMPLETED');
    expect(emailQueue.add).toHaveBeenCalledWith(
      'email.booking_confirmed',
      expect.objectContaining({ userId, bookingId }),
      expect.objectContaining({ jobId: `email-booking-confirmed-${bookingId}` })
    );
  });

  it('confirms cash bookings immediately and sends confirmation email', async () => {
    const bookingId = await createBooking('19:00', '20:00');
    emailQueue.add.mockClear();

    const initRes = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId, provider: 'cash' });

    expect(initRes.status).toBe(200);
    expect(initRes.body.data).toEqual(expect.objectContaining({
      isDirect: true,
      status: 'CONFIRMED',
    }));

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking.status).toBe('CONFIRMED');

    const payment = await prisma.payment.findFirst({ where: { booking_id: bookingId }, orderBy: { created_at: 'desc' } });
    expect(payment.provider.toLowerCase()).toBe('cash');
    expect(payment.status).toBe('PENDING');
    expect(emailQueue.add).toHaveBeenCalledWith(
      'email.booking_confirmed',
      expect.objectContaining({ userId, bookingId }),
      expect.objectContaining({ jobId: `email-booking-confirmed-${bookingId}` })
    );

    const confirmRes = await request(app)
      .patch(`/api/v1/owner/payments/${bookingId}/confirm-cash`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data).toEqual(expect.objectContaining({
      id: payment.id,
      status: 'COMPLETED',
    }));
  });

  it('allows owner to reject an unpaid booking from their field', async () => {
    const bookingId = await createBooking('20:00', '21:00');
    emailQueue.add.mockClear();

    const rejectRes = await request(app)
      .patch(`/api/v1/owner/bookings/${bookingId}/reject`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data).toEqual(expect.objectContaining({
      id: bookingId,
      status: 'CANCELLED',
    }));
    expect(emailQueue.add).toHaveBeenCalledWith(
      'email.booking_cancelled',
      expect.objectContaining({ userId, bookingId }),
      expect.objectContaining({ jobId: `email-booking-cancelled-${bookingId}` })
    );
  });

  it('treats duplicate terminal callbacks as idempotent provider acknowledgements', async () => {
    const bookingId = bookingIds[0];

    const duplicate = await postSepayIpn(bookingId, true);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body.success).toBe(true);
  });

  it('allows retry after a failed payment by creating a new pending payment attempt', async () => {
    const bookingId = await createBooking('20:00', '21:00');

    const firstInit = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId, provider: 'sepay' });
    expect(firstInit.status).toBe(200);

    const failedIpn = await postSepayIpn(bookingId, false);
    expect(failedIpn.status).toBe(200);

    const retryInit = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId, provider: 'sepay' });
    expect(retryInit.status).toBe(200);

    const attempts = await prisma.payment.findMany({
      where: { booking_id: bookingId },
      orderBy: { created_at: 'asc' },
    });

    expect(attempts).toHaveLength(2);
    expect(attempts[0].status).toBe('FAILED');
    expect(attempts[1].status).toBe('PENDING');
    expect(retryInit.body.data.paymentId).toBe(attempts[1].id);

    const detailRes = await request(app)
      .get(`/api/v1/payments/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: attempts[1].id,
        booking_id: bookingId,
        status: 'PENDING',
        provider: 'sepay',
      }),
    });
  }, 10000);
});
