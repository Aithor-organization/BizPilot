import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface RefreshTokenPayload {
  userId: string;
  tokenFamily: string;
  version: number;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: number; // days

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.refreshTokenSecret = secret;
    this.refreshTokenExpiresIn =
      configService.get<number>('REFRESH_TOKEN_EXPIRES_DAYS') || 30;
  }

  /**
   * 새 Refresh Token 생성 (로그인 시)
   */
  async createRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ token: string; tokenFamily: string }> {
    const tokenFamily = crypto.randomUUID();
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        tokenFamily,
        version: 0,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    this.logger.log(`Created refresh token for user ${userId}, family: ${tokenFamily.slice(0, 8)}...`);

    return { token, tokenFamily };
  }

  /**
   * Refresh Token으로 새 토큰 발급 (Token Rotation)
   */
  async rotateRefreshToken(
    token: string,
    tokenFamily: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ newToken: string; userId: string }> {
    const tokenHash = this.hashToken(token);

    // 현재 토큰 검증
    const existingToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        tokenFamily,
        isRevoked: false,
      },
    });

    if (!existingToken) {
      // 토큰 재사용 감지 - 해당 family 전체 무효화
      this.logger.warn(`Token reuse detected for family: ${tokenFamily.slice(0, 8)}...`);
      await this.revokeTokenFamily(tokenFamily);
      throw new UnauthorizedException('Invalid refresh token - possible token reuse attack');
    }

    // 만료 확인
    if (existingToken.expiresAt < new Date()) {
      this.logger.warn(`Expired refresh token for family: ${tokenFamily.slice(0, 8)}...`);
      throw new UnauthorizedException('Refresh token expired');
    }

    // 기존 토큰 무효화
    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { isRevoked: true },
    });

    // 새 토큰 생성 (같은 family, 버전 증가)
    const newToken = this.generateToken();
    const newTokenHash = this.hashToken(newToken);
    const newVersion = existingToken.version + 1;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId: existingToken.userId,
        tokenHash: newTokenHash,
        tokenFamily,
        version: newVersion,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    this.logger.log(
      `Rotated refresh token for user ${existingToken.userId}, family: ${tokenFamily.slice(0, 8)}..., version: ${newVersion}`,
    );

    return { newToken, userId: existingToken.userId };
  }

  /**
   * Token Family 전체 무효화 (재사용 공격 감지 시)
   */
  async revokeTokenFamily(tokenFamily: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenFamily },
      data: { isRevoked: true },
    });
    this.logger.warn(`Revoked all tokens in family: ${tokenFamily.slice(0, 8)}...`);
  }

  /**
   * 사용자의 모든 세션 무효화 (로그아웃 전체)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
    this.logger.log(`Revoked all refresh tokens for user: ${userId}`);
  }

  /**
   * 만료된 토큰 정리 (스케줄러에서 호출)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired/revoked tokens`);
    }
    return result.count;
  }

  /**
   * 토큰 생성 (랜덤 문자열)
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 토큰 해시 (HMAC-SHA256)
   */
  private hashToken(token: string): string {
    return crypto
      .createHmac('sha256', this.refreshTokenSecret)
      .update(token)
      .digest('hex');
  }
}
