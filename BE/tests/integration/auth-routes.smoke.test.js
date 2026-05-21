const request = require('supertest');
const app = require('../../src/app');

describe('Auth, OTP, and Password Route Smoke Tests', () => {
  describe('OTP routes', () => {
    it('POST /api/v1/otp/send should exist', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /api/v1/otp/verify should exist', async () => {
      const res = await request(app)
        .post('/api/v1/otp/verify')
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /api/v1/otp/resend should exist', async () => {
      const res = await request(app)
        .post('/api/v1/otp/resend')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('Password routes', () => {
    it('POST /api/v1/password/forgot should exist', async () => {
      const res = await request(app)
        .post('/api/v1/password/forgot')
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /api/v1/password/reset should exist', async () => {
      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /api/v1/password/change-request should exist', async () => {
      const res = await request(app)
        .post('/api/v1/password/change-request');

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/password/change should exist', async () => {
      const res = await request(app)
        .post('/api/v1/password/change');

      expect(res.status).toBe(401);
    });
  });
});