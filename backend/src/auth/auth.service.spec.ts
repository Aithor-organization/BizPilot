import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { SecurityAuditService } from '../common/services/security-audit.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;
  let securityAuditService: jest.Mocked<SecurityAuditService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    role: 'USER',
    emailVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefreshTokenResult = {
    token: 'refresh-token-123',
    tokenFamily: 'family-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'BCRYPT_ROUNDS') return 12;
              return '15m'; // JWT_ACCESS_EXPIRES_IN 기본값
            }),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            createRefreshToken: jest.fn().mockResolvedValue(mockRefreshTokenResult),
            rotateRefreshToken: jest.fn(),
            revokeTokenFamily: jest.fn(),
            revokeAllUserTokens: jest.fn(),
          },
        },
        {
          provide: SecurityAuditService,
          useValue: {
            logEvent: jest.fn(),
            recordLoginFailure: jest.fn().mockResolvedValue({ isLocked: false, remainingAttempts: 4 }),
            clearLoginFailures: jest.fn(),
            isAccountLocked: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    refreshTokenService = module.get(RefreshTokenService);
    securityAuditService = module.get(SecurityAuditService);
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

    it('should register a new user successfully', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(refreshTokenService.createRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('tokenFamily');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully with correct credentials', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto, undefined, '127.0.0.1');

      // Assert
      expect(securityAuditService.isAccountLocked).toHaveBeenCalledWith(loginDto.email, '127.0.0.1');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(securityAuditService.clearLoginFailures).toHaveBeenCalledWith(loginDto.email, '127.0.0.1');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto, undefined, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(securityAuditService.recordLoginFailure).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto, undefined, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(securityAuditService.recordLoginFailure).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account is locked (prevents user enumeration)', async () => {
      // Arrange
      (securityAuditService.isAccountLocked as jest.Mock).mockReturnValue(true);

      // Act & Assert
      // 사용자 열거 방지: 계정 잠금 시에도 동일 메시지 반환
      await expect(service.login(loginDto, undefined, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      // Arrange
      const refreshToken = 'old-refresh-token';
      const tokenFamily = 'family-123';
      (refreshTokenService.rotateRefreshToken as jest.Mock).mockResolvedValue({
        newToken: 'new-refresh-token',
        userId: mockUser.id,
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.refresh(refreshToken, tokenFamily);

      // Assert
      expect(refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
        refreshToken,
        tokenFamily,
        undefined,
        undefined,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(result).toHaveProperty('tokenFamily', tokenFamily);
    });

    it('should throw UnauthorizedException if user not found after rotation', async () => {
      // Arrange
      (refreshTokenService.rotateRefreshToken as jest.Mock).mockResolvedValue({
        newToken: 'new-refresh-token',
        userId: 'non-existent-user',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.refresh('token', 'family'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke token family on logout', async () => {
      // Arrange
      const tokenFamily = 'family-123';

      // Act
      await service.logout(tokenFamily);

      // Assert
      expect(refreshTokenService.revokeTokenFamily).toHaveBeenCalledWith(
        tokenFamily,
      );
    });
  });

  describe('logoutAll', () => {
    it('should revoke all user tokens on logoutAll', async () => {
      // Arrange
      const userId = 'user-123';

      // Act
      await service.logoutAll(userId);

      // Assert
      expect(refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser(
        mockUser.email,
        'Password123!',
      );

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      // Arrange
      const userWithoutPassword = { ...mockUser, passwordHash: null };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        userWithoutPassword,
      );

      // Act & Assert
      await expect(
        service.validateUser(mockUser.email, 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user for valid JWT payload', async () => {
      // Arrange
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role as 'USER' | 'ADMIN',
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.validateJwtPayload(payload);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
    });

    it('should throw UnauthorizedException for invalid JWT payload', async () => {
      // Arrange
      const payload = {
        sub: 'non-existent',
        email: 'test@example.com',
        role: 'USER' as const,
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateJwtPayload(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.getProfile(mockUser.id);

      // Assert
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('name', mockUser.name);
      expect(result).toHaveProperty('role', mockUser.role);
    });
  });
});
