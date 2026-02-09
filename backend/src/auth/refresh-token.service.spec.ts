import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockRefreshToken = {
    id: 'token-id-123',
    userId: 'user-123',
    tokenHash: 'hashed-token',
    tokenFamily: 'family-123',
    version: 0,
    userAgent: 'Test Agent',
    ipAddress: '127.0.0.1',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'JWT_SECRET':
                  return 'test-secret';
                case 'REFRESH_TOKEN_EXPIRES_DAYS':
                  return 30;
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRefreshToken', () => {
    it('should create a new refresh token', async () => {
      // Arrange
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );

      // Act
      const result = await service.createRefreshToken(
        'user-123',
        'Test Agent',
        '127.0.0.1',
      );

      // Assert
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('tokenFamily');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBe(64); // 32 bytes hex = 64 chars
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate refresh token successfully', async () => {
      // Arrange
      (prismaService.refreshToken.findFirst as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );
      (prismaService.refreshToken.update as jest.Mock).mockResolvedValue({
        ...mockRefreshToken,
        isRevoked: true,
      });
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue({
        ...mockRefreshToken,
        version: 1,
      });

      // Act
      // Note: We need to use the actual token hash, so we'll mock findFirst to accept any hash
      const result = await service.rotateRefreshToken(
        'any-token', // This won't match the hash, but findFirst is mocked
        mockRefreshToken.tokenFamily,
      );

      // Assert
      expect(prismaService.refreshToken.findFirst).toHaveBeenCalled();
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: { isRevoked: true },
      });
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
      expect(result).toHaveProperty('newToken');
      expect(result).toHaveProperty('userId', mockRefreshToken.userId);
    });

    it('should throw UnauthorizedException if token not found (possible reuse attack)', async () => {
      // Arrange
      (prismaService.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.rotateRefreshToken('invalid-token', 'family-123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenFamily: 'family-123' },
        data: { isRevoked: true },
      });
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      // Arrange
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      (prismaService.refreshToken.findFirst as jest.Mock).mockResolvedValue(
        expiredToken,
      );

      // Act & Assert
      await expect(
        service.rotateRefreshToken('token', mockRefreshToken.tokenFamily),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeTokenFamily', () => {
    it('should revoke all tokens in a family', async () => {
      // Arrange
      const tokenFamily = 'family-123';
      (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      // Act
      await service.revokeTokenFamily(tokenFamily);

      // Assert
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenFamily },
        data: { isRevoked: true },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      // Arrange
      const userId = 'user-123';
      (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      // Act
      await service.revokeAllUserTokens(userId);

      // Assert
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isRevoked: true },
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and revoked tokens', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 10,
      });

      // Act
      const result = await service.cleanupExpiredTokens();

      // Assert
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalled();
      expect(result).toBe(10);
    });

    it('should return 0 when no tokens to clean up', async () => {
      // Arrange
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      // Act
      const result = await service.cleanupExpiredTokens();

      // Assert
      expect(result).toBe(0);
    });
  });
});
