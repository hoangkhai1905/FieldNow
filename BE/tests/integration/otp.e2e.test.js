/**
 * OTP Integration Tests
 * Tests the complete OTP flow: register → send OTP → verify → login
 */

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const authService = require('../../src/services/auth.service');
const otpRepository = require('../../src/repositories/otp.repository');

// Test data
const testUser = {
  email: `otp-test-${Date.now()}@example.com`,
  password: 'testPassword123',
  fullName: 'OTP Test User',
  role: 'USER',
};

describe('OTP Integration Tests', () => {
  // Cleanup after all tests
  afterAll(async () => {
    try {
      await prisma.user.delete({ where: { email: testUser.email } });
    } catch (err) {
      // User might not exist if test failed during registration
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/otp/send', () => {
    it('should send OTP to registered user', async () => {
      // First, register a user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Send OTP
      const res = await request(app)
        .post('/api/v1/otp/send')
        .send({ email: testUser.email })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('OTP sent');
      expect(res.body.data.expiresIn).toBe(10 * 60 * 1000); // 10 minutes
    });

    it('should fail if user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should fail if email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail if email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should generate new OTP on subsequent sends', async () => {
      // Get first OTP
      const user1 = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      const firstOTP = user1.otp_code;

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send OTP again
      await request(app)
        .post('/api/v1/otp/send')
        .send({ email: testUser.email })
        .expect(200);

      // Get second OTP
      const user2 = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      const secondOTP = user2.otp_code;

      // OTPs should be different (statistically very unlikely to be the same)
      expect(firstOTP).not.toBe(secondOTP);
    });
  });

  describe('POST /api/v1/otp/verify', () => {
    let validOTP;

    beforeAll(async () => {
      // Send OTP to get a valid code
      await request(app)
        .post('/api/v1/otp/send')
        .send({ email: testUser.email })
        .expect(200);

      // Retrieve OTP from database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      validOTP = user.otp_code;
    });

    it('should verify OTP and mark email as verified', async () => {
      const res = await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: testUser.email, otp_code: validOTP })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Email verified');
      expect(res.body.data.user.is_email_verified).toBe(true);

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(user.is_email_verified).toBe(true);
      expect(user.otp_code).toBeNull(); // OTP should be cleared
      expect(user.otp_expires_at).toBeNull();
    });

    it('should fail with invalid OTP code', async () => {
      // Create a new user for this test
      const newEmail = `otp-test-invalid-${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: newEmail })
        .expect(201);

      // Send OTP
      await request(app)
        .post('/api/v1/otp/send')
        .send({ email: newEmail })
        .expect(200);

      // Try to verify with wrong code
      const res = await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: newEmail, otp_code: '000000' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid OTP');

      // Cleanup
      await prisma.user.delete({ where: { email: newEmail } });
    });

    it('should fail if OTP format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: testUser.email, otp_code: 'abcdef' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail if user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: 'nonexistent@example.com', otp_code: '123456' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('User not found');
    });

    it('should fail if OTP has expired', async () => {
      // Create a new user
      const newEmail = `otp-test-expire-${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: newEmail })
        .expect(201);

      // Send OTP
      await request(app)
        .post('/api/v1/otp/send')
        .send({ email: newEmail })
        .expect(200);

      // Get OTP and manually expire it
      const user = await prisma.user.findUnique({
        where: { email: newEmail },
      });
      const otpCode = user.otp_code;

      // Set expiration to past
      await prisma.user.update({
        where: { email: newEmail },
        data: { otp_expires_at: new Date(Date.now() - 1000) },
      });

      // Try to verify expired OTP
      const res = await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: newEmail, otp_code: otpCode })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('OTP has expired');

      // Cleanup
      await prisma.user.delete({ where: { email: newEmail } });
    });
  });

  describe('POST /api/v1/otp/resend', () => {
    it('should resend OTP to unverified user', async () => {
      // Create a new user
      const newEmail = `otp-test-resend-${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: newEmail })
        .expect(201);

      // Send initial OTP
      await request(app)
        .post('/api/v1/otp/send')
        .send({ email: newEmail })
        .expect(200);

      // Resend OTP
      const res = await request(app)
        .post('/api/v1/otp/resend')
        .send({ email: newEmail })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('OTP sent');

      // Cleanup
      await prisma.user.delete({ where: { email: newEmail } });
    });

    it('should fail if trying to resend to already verified user', async () => {
      const res = await request(app)
        .post('/api/v1/otp/resend')
        .send({ email: testUser.email }) // This user is already verified
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Email already verified');
    });

    it('should fail if user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/otp/resend')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Email Verification Requirement for Login', () => {
    it('should allow login after email is verified', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should block login if email is not verified', async () => {
      // Create a new unverified user
      const unverifiedEmail = `otp-test-login-${Date.now()}@example.com`;
      const unverifiedPassword = 'testPassword123';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: unverifiedEmail,
          password: unverifiedPassword,
          fullName: 'Unverified User',
          role: 'USER',
        })
        .expect(201);

      // Try to login without verification
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: unverifiedEmail,
          password: unverifiedPassword,
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Email not verified');

      // Cleanup
      await prisma.user.delete({ where: { email: unverifiedEmail } });
    });
  });

  describe('Complete OTP Flow', () => {
    it('should complete full OTP flow: register → send OTP → verify → login', async () => {
      const flowEmail = `otp-flow-${Date.now()}@example.com`;
      const flowPassword = 'flowTestPassword123';

      // Step 1: Register
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: flowEmail,
          password: flowPassword,
          fullName: 'Flow Test User',
          role: 'USER',
        })
        .expect(201);

      expect(registerRes.body.data.user.email).toBe(flowEmail);

      // Step 2: Try to login (should fail - email not verified)
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: flowEmail, password: flowPassword })
        .expect(401);

      // Step 3: Send OTP
      const sendOtpRes = await request(app)
        .post('/api/v1/otp/send')
        .send({ email: flowEmail })
        .expect(200);

      expect(sendOtpRes.body.data.message).toContain('OTP sent');

      // Step 4: Get OTP from database
      const userWithOtp = await prisma.user.findUnique({
        where: { email: flowEmail },
      });
      const otp = userWithOtp.otp_code;

      // Step 5: Verify OTP
      const verifyRes = await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: flowEmail, otp_code: otp })
        .expect(200);

      expect(verifyRes.body.data.user.is_email_verified).toBe(true);

      // Step 6: Login (should now succeed)
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: flowEmail, password: flowPassword })
        .expect(200);

      expect(loginRes.body.data).toHaveProperty('token');
      expect(loginRes.body.data.user.email).toBe(flowEmail);

      // Step 7: Verify token works with /auth/me
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`)
        .expect(200);

      expect(meRes.body.data.user.email).toBe(flowEmail);

      // Cleanup
      await prisma.user.delete({ where: { email: flowEmail } });
    });
  });
});
