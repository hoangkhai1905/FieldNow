/**
 * Password Reset and Change Password Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');

// Test data
const testUser = {
  email: `password-test-${Date.now()}@example.com`,
  password: 'oldPassword123',
  fullName: 'Password Test User',
  role: 'USER',
};

describe('Password Reset and Change Password Tests', () => {
  let userWithVerifiedEmail;
  let jwtToken;

  // Setup: Create user with verified email
  beforeAll(async () => {
    // Register user
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    // Verify email via OTP
    await request(app)
      .post('/api/v1/otp/send')
      .send({ email: testUser.email })
      .expect(200);

    const userWithOtp = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    await request(app)
      .post('/api/v1/otp/verify')
      .send({ email: testUser.email, otp_code: userWithOtp.otp_code })
      .expect(200);

    // Login to get JWT token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    jwtToken = loginRes.body.data.token;
    userWithVerifiedEmail = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
  });

  // Cleanup
  afterAll(async () => {
    try {
      await prisma.user.delete({ where: { email: testUser.email } });
    } catch (err) {
      // User might not exist
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/password/forgot', () => {
    it('should request password reset for existing user', async () => {
      const res = await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: testUser.email })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('reset instructions');
      expect(res.body.data.expiresIn).toBe(10 * 60 * 1000);
    });

    it('should not reveal if email exists (security)', async () => {
      const res = await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return same message as successful request
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('reset instructions');
    });

    it('should fail if email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail if email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/password/forgot')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/password/reset', () => {
    let resetOtpCode;

    beforeAll(async () => {
      // Send password reset request
      await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: testUser.email })
        .expect(200);

      // Get OTP from database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      resetOtpCode = user.otp_code;
    });

    it('should reset password with valid OTP', async () => {
      const newPassword = 'newPassword123';

      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: testUser.email,
          otp_code: resetOtpCode,
          new_password: newPassword,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Password reset');

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: newPassword })
        .expect(200);

      expect(loginRes.body.data).toHaveProperty('token');

      // Update test user password for subsequent tests
      testUser.password = newPassword;
    });

    it('should fail with invalid OTP', async () => {
      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: testUser.email,
          otp_code: '000000',
          new_password: 'anotherPassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid OTP');
    });

    it('should fail with expired OTP', async () => {
      // Send new reset request
      await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: testUser.email })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      const otpCode = user.otp_code;

      // Expire the OTP
      await prisma.user.update({
        where: { email: testUser.email },
        data: { otp_expires_at: new Date(Date.now() - 1000) },
      });

      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: testUser.email,
          otp_code: otpCode,
          new_password: 'anotherPassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('OTP has expired');
    });

    it('should fail if new password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: testUser.email,
          otp_code: '123456',
          new_password: 'short',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail if user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: 'nonexistent@example.com',
          otp_code: '123456',
          new_password: 'newPassword123',
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/password/change-request', () => {
    it('should request password change for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/password/change-request')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('OTP sent');
      expect(res.body.data.expiresIn).toBe(10 * 60 * 1000);
    });

    it('should fail if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/password/change-request')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should fail with invalid JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/password/change-request')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/password/change', () => {
    let changePasswordOtpCode;

    beforeAll(async () => {
      // Request change password
      await request(app)
        .post('/api/v1/password/change-request')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      // Get OTP from database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      changePasswordOtpCode = user.otp_code;
    });

    it('should change password with valid OTP', async () => {
      const newPassword = 'changedPassword123';

      const res = await request(app)
        .post('/api/v1/password/change')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          otp_code: changePasswordOtpCode,
          new_password: newPassword,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Password changed');

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: newPassword })
        .expect(200);

      expect(loginRes.body.data).toHaveProperty('token');

      // Update test user password for subsequent tests
      testUser.password = newPassword;
    });

    it('should fail with invalid OTP', async () => {
      const res = await request(app)
        .post('/api/v1/password/change')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          otp_code: '000000',
          new_password: 'anotherPassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid OTP');
    });

    it('should fail if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/password/change')
        .send({
          otp_code: '123456',
          new_password: 'newPassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should fail if new password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/password/change')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          otp_code: '123456',
          new_password: 'short',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Complete Password Reset Flow', () => {
    it('should complete: forgot password → reset password', async () => {
      const flowEmail = `password-flow-${Date.now()}@example.com`;
      const oldPassword = 'oldFlowPassword123';
      const newPassword = 'newFlowPassword123';

      // Step 1: Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: flowEmail,
          password: oldPassword,
          fullName: 'Flow Test User',
          role: 'USER',
        })
        .expect(201);

      // Step 2: Verify email
      await request(app)
        .post('/api/v1/otp/send')
        .send({ email: flowEmail })
        .expect(200);

      let user = await prisma.user.findUnique({ where: { email: flowEmail } });
      await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: flowEmail, otp_code: user.otp_code })
        .expect(200);

      // Step 3: Request password reset
      const forgotRes = await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: flowEmail })
        .expect(200);

      expect(forgotRes.body.data.message).toContain('reset instructions');

      // Step 4: Get reset OTP
      user = await prisma.user.findUnique({ where: { email: flowEmail } });
      const resetOtp = user.otp_code;

      // Step 5: Reset password
      const resetRes = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: flowEmail,
          otp_code: resetOtp,
          new_password: newPassword,
        })
        .expect(200);

      expect(resetRes.body.data.message).toContain('Password reset');

      // Step 6: Login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: flowEmail, password: newPassword })
        .expect(200);

      expect(loginRes.body.data).toHaveProperty('token');

      // Cleanup
      await prisma.user.delete({ where: { email: flowEmail } });
    });
  });
});
