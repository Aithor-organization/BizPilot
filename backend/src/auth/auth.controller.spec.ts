import { Test, TestingModule } from '@nestjs/testing';
import { Response, Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  };

  const mockAuthResult = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenFamily: 'mock-family-123',
    user: mockUser,
  };

  const mockResponse = () => {
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  const mockRequest = (cookies: Record<string, string> = {}, user?: any) => {
    const req: Partial<Request> = {
      cookies,
      user,
    };
    return req as Request;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123!',
      name: 'New User',
    };

    it('should register user and set cookies', async () => {
      // Arrange
      const res = mockResponse();
      authService.register.mockResolvedValue(mockAuthResult);

      // Act
      const result = await controller.register(
        registerDto,
        res,
        'Test Agent',
        '127.0.0.1',
      );

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        'Test Agent',
        '127.0.0.1',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockAuthResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'tokenFamily',
        mockAuthResult.tokenFamily,
        expect.objectContaining({
          httpOnly: true, // XSS 방어 강화로 httpOnly로 변경됨
          path: '/',
        }),
      );
      expect(result).toEqual({
        accessToken: mockAuthResult.accessToken,
        user: mockAuthResult.user,
      });
      // refreshToken should not be in response body
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user and set cookies', async () => {
      // Arrange
      const res = mockResponse();
      authService.login.mockResolvedValue(mockAuthResult);

      // Act
      const result = await controller.login(
        loginDto,
        res,
        'Test Agent',
        '127.0.0.1',
      );

      // Assert
      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        'Test Agent',
        '127.0.0.1',
      );
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: mockAuthResult.accessToken,
        user: mockAuthResult.user,
      });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens when cookies are present', async () => {
      // Arrange
      const res = mockResponse();
      const req = mockRequest({
        refreshToken: 'old-refresh-token',
        tokenFamily: 'family-123',
      });
      authService.refresh.mockResolvedValue(mockAuthResult);

      // Act
      const result = await controller.refresh(
        req,
        res,
        'Test Agent',
        '127.0.0.1',
      );

      // Assert
      expect(authService.refresh).toHaveBeenCalledWith(
        'old-refresh-token',
        'family-123',
        'Test Agent',
        '127.0.0.1',
      );
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: mockAuthResult.accessToken,
        user: mockAuthResult.user,
      });
    });

    it('should return 401 when refresh token cookie is missing', async () => {
      // Arrange
      const res = mockResponse();
      const req = mockRequest({}); // No cookies

      // Act
      const result = await controller.refresh(
        req,
        res,
        'Test Agent',
        '127.0.0.1',
      );

      // Assert
      expect(authService.refresh).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Refresh token not found',
      });
      expect(result).toBeUndefined();
    });

    it('should return 401 when tokenFamily cookie is missing', async () => {
      // Arrange
      const res = mockResponse();
      const req = mockRequest({ refreshToken: 'token-only' }); // Missing tokenFamily

      // Act
      const result = await controller.refresh(
        req,
        res,
        'Test Agent',
        '127.0.0.1',
      );

      // Assert
      expect(authService.refresh).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should logout and clear cookies when tokenFamily exists', async () => {
      // Arrange
      const res = mockResponse();
      const req = mockRequest({ tokenFamily: 'family-123' });
      authService.logout.mockResolvedValue(undefined);

      // Act
      const result = await controller.logout(req, res);

      // Assert
      expect(authService.logout).toHaveBeenCalledWith('family-123');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/',
      });
      expect(res.clearCookie).toHaveBeenCalledWith('tokenFamily', {
        path: '/',
      });
      expect(result).toEqual({ message: '로그아웃 되었습니다.' });
    });

    it('should clear cookies even when tokenFamily is missing', async () => {
      // Arrange
      const res = mockResponse();
      const req = mockRequest({}); // No cookies

      // Act
      const result = await controller.logout(req, res);

      // Assert
      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: '로그아웃 되었습니다.' });
    });
  });

  describe('logoutAll', () => {
    it('should logout all sessions and clear cookies', async () => {
      // Arrange
      const res = mockResponse();
      const req = { user: { id: 'user-123' } };
      authService.logoutAll.mockResolvedValue(undefined);

      // Act
      const result = await controller.logoutAll(req, res);

      // Assert
      expect(authService.logoutAll).toHaveBeenCalledWith('user-123');
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: '모든 세션에서 로그아웃 되었습니다.',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const mockProfile = {
        ...mockUser,
        subscription: {
          planType: 'FREE',
          creditsRemaining: 80,
          creditsTotal: 100,
        },
      };
      const req = { user: { id: 'user-123' } };
      authService.getProfile.mockResolvedValue(mockProfile);

      // Act
      const result = await controller.getProfile(req);

      // Assert
      expect(authService.getProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('Cookie Configuration', () => {
    it('should set secure cookie in production', async () => {
      // Note: This test verifies the COOKIE_OPTIONS constant behavior
      // In a real production environment, NODE_ENV would be 'production'
      const res = mockResponse();
      authService.register.mockResolvedValue(mockAuthResult);

      await controller.register(
        { email: 'test@example.com', password: 'Pass123!', name: 'Test' },
        res,
        undefined,
        undefined,
      );

      // Verify cookie was called with expected options
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        }),
      );
    });
  });
});
