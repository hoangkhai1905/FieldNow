const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');

describe('Phase 2 Integration Tests', () => {
  let userToken, ownerToken, adminToken;
  let ownerId, fieldId;

  beforeAll(async () => {
    // We assume seed data is present (from prisma:seed)
    const owner = await prisma.user.findUnique({ where: { email: 'owner@fieldnow.dev' } });
    const user = await prisma.user.findUnique({ where: { email: 'user@fieldnow.dev' } });
    const admin = await prisma.user.findUnique({ where: { email: 'admin@fieldnow.dev' } });

    ownerId = owner.id;

    ownerToken = jwt.sign({ userId: owner.id, role: owner.role, email: owner.email }, config.jwtSecret, { expiresIn: '1h' });
    userToken = jwt.sign({ userId: user.id, role: user.role, email: user.email }, config.jwtSecret, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: admin.id, role: admin.role, email: admin.email }, config.jwtSecret, { expiresIn: '1h' });

    const field = await prisma.field.findFirst({ where: { owner_id: ownerId } });
    fieldId = field.id;
  });

  describe('Authorization Boundaries', () => {
    it('USER should not access owner routes', async () => {
      const res = await request(app)
        .post('/api/v1/owner/fields')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test', location: 'Test', pricePerHour: 100
        });

      expect(res.status).toBe(403);
    });

    it('OWNER should not access admin routes', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/fields/${fieldId}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Public Fields Search', () => {
    it('should return paginated list of active fields', async () => {
      const res = await request(app).get('/api/v1/fields');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.fields)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter by location', async () => {
      const res = await request(app).get('/api/v1/fields?location=Ho Chi Minh');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
