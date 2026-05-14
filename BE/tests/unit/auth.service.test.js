const authService = require('../../src/services/auth.service');
const userRepository = require('../../src/repositories/user.repository');
const refreshTokenRepository = require('../../src/repositories/refresh-token.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the repository layer
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/refresh-token.repository');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== REGISTER =====
  describe('register', () => {
    it('should register a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'USER',
      });

      const result = await authService.register('test@example.com', 'password123', 'Test User');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'USER',
        })
      );
      expect(result).toEqual({
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should hash the password before storing', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'USER',
      });

      await authService.register('test@example.com', 'mypassword');

      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('mypassword');
      const isHashed = await bcrypt.compare('mypassword', createCall.password);
      expect(isHashed).toBe(true);
    });

    it('should assign the provided role', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: 'uuid-123',
        email: 'owner@example.com',
        role: 'OWNER',
      });

      await authService.register('owner@example.com', 'password123', 'Owner', 'OWNER');

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'OWNER' })
      );
    });

    it('should throw CONFLICT if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'existing-uuid', email: 'dup@example.com' });

      await expect(
        authService.register('dup@example.com', 'password123')
      ).rejects.toMatchObject({
        code: 'CONFLICT',
        statusCode: 409,
      });

      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  // ===== LOGIN =====
  describe('login', () => {
    const mockUser = {
      id: 'uuid-456',
      email: 'user@example.com',
      password: bcrypt.hashSync('correctpassword', 10),
      role: 'USER',
      full_name: 'Test User',
      is_active: true,
      is_email_verified: true,
    };

    it('should return token and user on valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await authService.login('user@example.com', 'correctpassword');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: 'uuid-456',
        email: 'user@example.com',
        role: 'USER',
        full_name: 'Test User',
      });

      // Verify the token is a valid JWT
      const decoded = jwt.decode(result.token);
      expect(decoded).toMatchObject({
        userId: 'uuid-456',
        role: 'USER',
        email: 'user@example.com',
      });
    });

    it('should throw UNAUTHORIZED if email not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'whatever')
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        statusCode: 401,
      });
    });

    it('should throw UNAUTHORIZED if password is wrong', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login('user@example.com', 'wrongpassword')
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        statusCode: 401,
      });
    });
  });

  describe('refreshToken', () => {
    const storedToken = {
      id: 'refresh-1',
      user_id: 'uuid-456',
      token_hash: 'hash',
      revoked_at: null,
      expires_at: new Date(Date.now() + 60000),
    };

    const activeUser = {
      id: 'uuid-456',
      email: 'user@example.com',
      role: 'USER',
      is_active: true,
    };

    beforeEach(() => {
      refreshTokenRepository.findByHash.mockResolvedValue(storedToken);
      refreshTokenRepository.revokeById.mockResolvedValue({});
      refreshTokenRepository.touchLastUsed.mockResolvedValue({});
      refreshTokenRepository.create.mockResolvedValue({});
      refreshTokenRepository.deleteOldestTokens.mockResolvedValue({});
      userRepository.findById.mockResolvedValue(activeUser);
    });

    it('rotates refresh tokens and revokes the old token', async () => {
      const result = await authService.refreshToken('old-refresh-token');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepository.revokeById).toHaveBeenCalledWith(storedToken.id);
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: activeUser.id })
      );
    });

    it('rejects reuse of a revoked refresh token', async () => {
      refreshTokenRepository.findByHash.mockResolvedValue({
        ...storedToken,
        revoked_at: new Date(),
      });

      await expect(authService.refreshToken('old-refresh-token')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        statusCode: 401,
      });
      expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    });

    it('rejects refresh for a deactivated user', async () => {
      userRepository.findById.mockResolvedValue({
        ...activeUser,
        is_active: false,
      });

      await expect(authService.refreshToken('old-refresh-token')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        statusCode: 403,
      });
    });
  });

  describe('logout', () => {
    it('revokes an active refresh token', async () => {
      refreshTokenRepository.findByHash.mockResolvedValue({
        id: 'refresh-1',
        revoked_at: null,
      });
      refreshTokenRepository.revokeById.mockResolvedValue({});

      const result = await authService.logout('refresh-token');

      expect(result).toEqual({ success: true });
      expect(refreshTokenRepository.revokeById).toHaveBeenCalledWith('refresh-1');
    });
  });
});
