const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const supabase = require('../../src/infrastructure/supabase');

// Mock Supabase storage
jest.mock('../../src/infrastructure/supabase', () => ({
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://mock-url.com/image.jpg' } }),
    remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
  },
}));

describe('Upload Integration Tests', () => {
  let ownerToken;
  let _ownerId;

  beforeAll(async () => {
    // Cleanup and setup test owner
    await prisma.user.deleteMany({ where: { email: 'upload_owner@test.com' } });
    const owner = await prisma.user.create({
      data: {
        email: 'upload_owner@test.com',
        password: 'password123',
        role: 'OWNER',
      },
    });
    _ownerId = owner.id;
    ownerToken = jwt.sign({ userId: owner.id, role: 'OWNER' }, config.jwtSecret);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'upload_owner@test.com' } });
  });

  describe('POST /api/v1/upload/images', () => {
    it('should upload images successfully when called by OWNER', async () => {
      const res = await request(app)
        .post('/api/v1/upload/images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('images', Buffer.from('fake-image-content'), 'test.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.urls).toContain('https://mock-url.com/image.jpg');
      expect(supabase.storage.from).toHaveBeenCalledWith(config.supabase.bucket);
    });

    it('should return 400 if no images are uploaded', async () => {
      const res = await request(app)
        .post('/api/v1/upload/images')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 if called by a regular USER', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'upload_user@test.com',
          password: 'password123',
          role: 'USER',
        },
      });
      const userToken = jwt.sign({ userId: user.id, role: 'USER' }, config.jwtSecret);

      const res = await request(app)
        .post('/api/v1/upload/images')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('images', Buffer.from('fake-image-content'), 'test.jpg');

      expect(res.status).toBe(403);
      
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('DELETE /api/v1/upload/images', () => {
    it('should delete image successfully', async () => {
      const res = await request(app)
        .delete('/api/v1/upload/images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ url: 'https://mock-url.com/storage/v1/object/public/field-images/fields/1/test.jpg' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(supabase.storage.remove).toHaveBeenCalled();
    });

    it('should return 400 if url is missing', async () => {
      const res = await request(app)
        .delete('/api/v1/upload/images')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
