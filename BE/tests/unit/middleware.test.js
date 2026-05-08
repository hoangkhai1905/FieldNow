const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { authMiddleware } = require('../../src/middlewares/auth.middleware');
const { roleMiddleware } = require('../../src/middlewares/role.middleware');
const { validate } = require('../../src/middlewares/validate.middleware');
const { registerSchema } = require('../../src/validators/auth.validator');
const userRepository = require('../../src/repositories/user.repository');

jest.mock('../../src/repositories/user.repository');

// Helper to create mock req/res/next
const mockReqResNext = (overrides = {}) => {
  const req = {
    headers: {},
    body: {},
    user: null,
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

describe('Auth Middleware', () => {
  const validToken = jwt.sign(
    { userId: 'uuid-1', role: 'USER', email: 'user@test.com' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  it('should pass and set req.user with valid token', async () => {
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${validToken}` },
    });

    userRepository.findById.mockResolvedValue({ id: 'uuid-1', is_active: true });

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({
      userId: 'uuid-1',
      role: 'USER',
      email: 'user@test.com',
    });
  });

  it('should return 401 when no Authorization header', () => {
    const { req, res, next } = mockReqResNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with malformed Authorization header', () => {
    const { req, res, next } = mockReqResNext({
      headers: { authorization: 'Basic abc123' },
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with expired token', () => {
    const expiredToken = jwt.sign(
      { userId: 'uuid-1', role: 'USER' },
      config.jwtSecret,
      { expiresIn: '0s' }
    );
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${expiredToken}` },
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with wrong secret', () => {
    const badToken = jwt.sign({ userId: 'uuid-1' }, 'wrong-secret');
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${badToken}` },
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Role Middleware', () => {
  it('should pass when user has allowed role', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { userId: 'uuid-1', role: 'ADMIN' };

    roleMiddleware(['ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should pass when user has one of multiple allowed roles', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { userId: 'uuid-1', role: 'OWNER' };

    roleMiddleware(['ADMIN', 'OWNER'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 403 when role is not allowed', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { userId: 'uuid-1', role: 'USER' };

    roleMiddleware(['ADMIN'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when req.user is missing', () => {
    const { req, res, next } = mockReqResNext();
    req.user = null;

    roleMiddleware(['ADMIN'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Validate Middleware', () => {
  it('should pass and sanitize body on valid input', () => {
    const { req, res, next } = mockReqResNext({
      body: { email: 'test@example.com', password: 'password123' },
    });

    validate(registerSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'test@example.com', password: 'password123' });
  });

  it('should throw AppError on invalid input', () => {
    const { req, res, next } = mockReqResNext({
      body: { email: 'not-an-email', password: '12' },
    });

    expect(() => validate(registerSchema)(req, res, next)).toThrow();
  });

  it('should strip unknown fields from body', () => {
    const { req, res, next } = mockReqResNext({
      body: { email: 'test@example.com', password: 'password123', hack: 'injected' },
    });

    validate(registerSchema)(req, res, next);

    expect(req.body).not.toHaveProperty('hack');
  });
});
