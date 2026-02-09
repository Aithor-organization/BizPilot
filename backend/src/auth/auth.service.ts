import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import { SecurityAuditService } from '../common/services/security-audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

// Enum 대체 상수
export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export interface JwtPayload {
  sub: string;
  // email 제거: JWT는 Base64 디코딩 가능하므로 민감정보 노출 위험
  role: UserRoleType;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export interface AuthResponseWithRefresh extends AuthResponse {
  refreshToken: string;
  tokenFamily: string;
}

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn: string;
  private readonly bcryptRounds: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
    private securityAuditService: SecurityAuditService,
  ) {
    // Access Token은 짧게 (15분)
    this.accessTokenExpiresIn =
      configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';

    // bcrypt 라운드 수 (기본 12, 환경 변수로 조정 가능)
    this.bcryptRounds = configService.get<number>('BCRYPT_ROUNDS') || 12;
  }

  async register(
    dto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseWithRefresh> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // Hash password (라운드 수는 환경 변수로 설정 가능)
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    return this.generateAuthResponseWithRefresh(user, userAgent, ipAddress);
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseWithRefresh> {
    const ip = ipAddress || 'unknown';

    // 브루트포스 방지: 계정 잠금 확인
    // 사용자 열거 방지: 계정 존재 여부와 무관하게 동일 메시지
    if (this.securityAuditService.isAccountLocked(dto.email, ip)) {
      await this.securityAuditService.logEvent({
        type: 'LOGIN_FAILURE',
        ip,
        userAgent,
        details: { reason: 'Account locked', email: dto.email },
      });
      // 사용자 열거 방지: 일반적인 메시지 사용
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    try {
      const user = await this.validateUser(dto.email, dto.password);

      // 로그인 성공: 실패 기록 초기화
      this.securityAuditService.clearLoginFailures(dto.email, ip);
      await this.securityAuditService.logEvent({
        type: 'LOGIN_SUCCESS',
        userId: user.id,
        ip,
        userAgent,
      });

      return this.generateAuthResponseWithRefresh(user, userAgent, ipAddress);
    } catch (error) {
      // 로그인 실패: 실패 기록
      const { isLocked, remainingAttempts } =
        await this.securityAuditService.recordLoginFailure(dto.email, ip);
      await this.securityAuditService.logEvent({
        type: 'LOGIN_FAILURE',
        ip,
        userAgent,
        details: { email: dto.email, remainingAttempts },
      });

      // 사용자 열거 방지: 잠금 시에도 동일 메시지 사용
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
  }

  async refresh(
    refreshToken: string,
    tokenFamily: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseWithRefresh> {
    // Token Rotation: 기존 토큰 무효화 + 새 토큰 발급
    const { newToken, userId } = await this.refreshTokenService.rotateRefreshToken(
      refreshToken,
      tokenFamily,
      userAgent,
      ipAddress,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newToken,
      tokenFamily,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(tokenFamily: string): Promise<void> {
    await this.refreshTokenService.revokeTokenFamily(tokenFamily);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return user;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private generateAccessToken(user: User): string {
    // JWT payload에 민감정보(email) 미포함 - Base64 디코딩 가능하므로
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role as UserRoleType,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  private async generateAuthResponseWithRefresh(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseWithRefresh> {
    const accessToken = this.generateAccessToken(user);
    const { token: refreshToken, tokenFamily } =
      await this.refreshTokenService.createRefreshToken(
        user.id,
        userAgent,
        ipAddress,
      );

    return {
      accessToken,
      refreshToken,
      tokenFamily,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
