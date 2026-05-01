const request = require('supertest');
const app = require('../../src/app');

describe('Health & Route Smoke Tests', () => {
  describe('GET /health', () => {
    it('should return 200 with OK status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          status: 'OK',
        },
      });
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  describe('Auth Routes Existence', () => {
    it('POST /api/v1/auth/register should exist (returns 400 on empty body, not 404)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      // 400 = route exists and validation kicked in; 404 = route not found
      expect(res.status).not.toBe(404);
    });

    it('POST /api/v1/auth/login should exist (returns 400 on empty body, not 404)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).not.toBe(404);
    });

    it('GET /api/v1/auth/me should exist (returns 401 without token, not 404)', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      });
    });
  });

  describe('Unknown routes', () => {
    it('should return 404 for unknown API routes', async () => {
      const res = await request(app).get('/api/v1/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('Response headers', () => {
    it('should include security headers from helmet', async () => {
      const res = await request(app).get('/health');

      // Helmet sets these by default
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });
});
