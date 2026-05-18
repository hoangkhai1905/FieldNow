/**
 * Password Reset and Change Password Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/prisma');
const { emailQueue } = require('../../src/infrastructure/queue');

// Test data
const testUser = {
  email: `password-test-${Date.now()}@example.com`,
  password: 'oldPassword123',
  fullName: 'Password Test User',
  role: 'USER',
};

const getLastOtpForEmail = (email, jobName) => {
  const calls = emailQueue.add.mock.calls
    .filter(([name, payload]) => name === jobName && payload.email === email);
  if (calls.length === 0) return null;
  return calls[calls.length - 1][1].otpCode;
};

const allowResend = async (email) => {
  await prisma.user.update({
    where: { email },
    data: {
      otp_attempts: 0,
      otp_last_sent_at: new Date(Date.now() - 1000),
      otp_resend_available_at: new Date(Date.now() - 1000),
    },
  });
};

const createVerifiedUser = async (email, password) => {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, fullName: 'Test User', role: 'USER' })
    .expect(201);

  await allowResend(email);

  await request(app)
    .post('/api/v1/otp/send')
    .send({ email })
    .expect(200);

  const otpCode = getLastOtpForEmail(email, 'email.otp_sent');
  await request(app)
    .post('/api/v1/otp/verify')
    .send({ email, otp_code: otpCode })
    .expect(200);
};

describe('Password Reset and Change Password Tests', () => {
  let _userWithVerifiedEmail;
  let jwtToken;

  // Setup: Create user with verified email
  beforeAll(async () => {
    // Register user
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    // Verify email via OTP
    await allowResend(testUser.email);
    await request(app)
      .post('/api/v1/otp/send')
      .send({ email: testUser.email })
      .expect(200);

    await request(app)
      .post('/api/v1/otp/verify')
      .send({ email: testUser.email, otp_code: getLastOtpForEmail(testUser.email, 'email.otp_sent') })
      .expect(200);

    // Login to get JWT token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    jwtToken = loginRes.body.data.token;
    _userWithVerifiedEmail = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
  });

  // Cleanup
  afterAll(async () => {
    try {
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      if (user) {
        await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
      }
      await prisma.user.delete({ where: { email: testUser.email } });
    } catch (_err) {
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
      await allowResend(testUser.email);
      // Send password reset request
      await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: testUser.email })
        .expect(200);

      resetOtpCode = getLastOtpForEmail(testUser.email, 'email.password_reset_otp');
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
      const invalidEmail = `password-invalid-${Date.now()}@example.com`;
      await createVerifiedUser(invalidEmail, 'tempPassword123');
      await allowResend(invalidEmail);
      await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: invalidEmail })
        .expect(200);

      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: invalidEmail,
          otp_code: '000000',
          new_password: 'anotherPassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid OTP');

      const user = await prisma.user.findUnique({ where: { email: invalidEmail } });
      if (user) {
        await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
      }
      await prisma.user.delete({ where: { email: invalidEmail } });
    });

    it('should fail with expired OTP', async () => {
      const expiredEmail = `password-expired-${Date.now()}@example.com`;
      await createVerifiedUser(expiredEmail, 'tempPassword123');
      await allowResend(expiredEmail);
      await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: expiredEmail })
        .expect(200);

      const otpCode = getLastOtpForEmail(expiredEmail, 'email.password_reset_otp');

      // Expire the OTP
      await prisma.user.update({
        where: { email: expiredEmail },
        data: { otp_expires_at: new Date(Date.now() - 1000) },
      });

      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: expiredEmail,
          otp_code: otpCode,
          new_password: 'anotherPassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('OTP has expired');

      const user = await prisma.user.findUnique({ where: { email: expiredEmail } });
      if (user) {
        await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
      }
      await prisma.user.delete({ where: { email: expiredEmail } });
    });

    it('should fail if new password is too short', async () => {
      const shortEmail = `password-short-${Date.now()}@example.com`;
      await createVerifiedUser(shortEmail, 'tempPassword123');
      await allowResend(shortEmail);
      await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: shortEmail })
        .expect(200);

      const otpCode = getLastOtpForEmail(shortEmail, 'email.password_reset_otp');

      const res = await request(app)
        .post('/api/v1/password/reset')
        .send({
          email: shortEmail,
          otp_code: otpCode,
          new_password: 'short',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      const user = await prisma.user.findUnique({ where: { email: shortEmail } });
      if (user) {
        await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
      }
      await prisma.user.delete({ where: { email: shortEmail } });
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
      await allowResend(testUser.email);
      const res = await request(app)
        .post('/api/v1/password/change-request')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('OTP');
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
      await allowResend(testUser.email);
      // Request change password
      await request(app)
        .post('/api/v1/password/change-request')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      changePasswordOtpCode = getLastOtpForEmail(testUser.email, 'email.change_password_otp');
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
      await allowResend(testUser.email);
      await request(app)
        .post('/api/v1/password/change-request')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

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
      const shortChangeEmail = `password-change-short-${Date.now()}@example.com`;
      const shortChangePassword = 'tempPassword123';
      await createVerifiedUser(shortChangeEmail, shortChangePassword);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: shortChangeEmail, password: shortChangePassword })
        .expect(200);

      const tempToken = loginRes.body.data.token;
      await allowResend(shortChangeEmail);
      await request(app)
        .post('/api/v1/password/change-request')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      const otpCode = getLastOtpForEmail(shortChangeEmail, 'email.change_password_otp');
      const res = await request(app)
        .post('/api/v1/password/change')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          otp_code: otpCode,
          new_password: 'short',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      const user = await prisma.user.findUnique({ where: { email: shortChangeEmail } });
      if (user) {
        await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
      }
      await prisma.user.delete({ where: { email: shortChangeEmail } });
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
      await allowResend(flowEmail);
      await request(app)
        .post('/api/v1/otp/send')
        .send({ email: flowEmail })
        .expect(200);

      let _user = await prisma.user.findUnique({ where: { email: flowEmail } });
      await request(app)
        .post('/api/v1/otp/verify')
        .send({ email: flowEmail, otp_code: getLastOtpForEmail(flowEmail, 'email.otp_sent') })
        .expect(200);

      // Step 3: Request password reset
      await allowResend(flowEmail);
      const forgotRes = await request(app)
        .post('/api/v1/password/forgot')
        .send({ email: flowEmail })
        .expect(200);

      expect(forgotRes.body.data.message).toContain('reset instructions');

      // Step 4: Get reset OTP
      _user = await prisma.user.findUnique({ where: { email: flowEmail } });
      const resetOtp = getLastOtpForEmail(flowEmail, 'email.password_reset_otp');

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
      const cleanupUser = await prisma.user.findUnique({ where: { email: flowEmail } });
      if (cleanupUser) {
        await prisma.refreshToken.deleteMany({ where: { user_id: cleanupUser.id } });
      }
      await prisma.user.delete({ where: { email: flowEmail } });
    }, 10000);
  });
});
