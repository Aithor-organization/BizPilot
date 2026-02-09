/**
 * CSRF Protection Guard
 * 상태 변경 요청(POST, PUT, DELETE)에 대한 CSRF 토큰 검증
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export const SKIP_CSRF_KEY = 'skipCsrf';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly csrfSecret: string;
  private readonly isEnabled: boolean;
  private readonly allowLegacyTokens: boolean;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    // CSRF 보호는 운영 환경에서만 강제 (또는 명시적으로 활성화)
    this.isEnabled =
      this.configService.get<string>('NODE_ENV') === 'production' ||
      this.configService.get<boolean>('CSRF_ENABLED') === true;

    // 레거시 토큰 허용 여부 (마이그레이션 기간에만 true, 기본값 false)
    // 보안 경고: 레거시 토큰은 HMAC 서명이 없어 위조 가능성 있음
    this.allowLegacyTokens = this.configService.get<boolean>('CSRF_ALLOW_LEGACY') === true;

    // CSRF_SECRET 필수 검증 (운영 환경)
    const secret = this.configService.get<string>('CSRF_SECRET');
    if (this.isEnabled && (!secret || secret.length < 32)) {
      throw new Error(
        'CSRF_SECRET must be at least 32 characters in production environment',
      );
    }
    this.csrfSecret = secret || '';
  }

  canActivate(context: ExecutionContext): boolean {
    // 개발 환경에서 비활성화
    if (!this.isEnabled) {
      return true;
    }

    // SkipCsrf 데코레이터 확인
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // GET, HEAD, OPTIONS는 CSRF 검증 불필요
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (safeMethod) {
      return true;
    }

    // CSRF 토큰 검증
    const csrfToken = request.headers['x-csrf-token'];
    const cookieToken = request.cookies?.['csrf-token'];

    if (!csrfToken || !cookieToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // 타이밍 안전 비교 (해시 비교로 길이 정보 유출 방지)
    const hash1 = crypto.createHash('sha256').update(csrfToken).digest();
    const hash2 = crypto.createHash('sha256').update(cookieToken).digest();

    if (!crypto.timingSafeEqual(hash1, hash2)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    // HMAC 서명 검증 (토큰 위조 방지)
    if (!this.verifyTokenSignature(csrfToken)) {
      throw new ForbiddenException('Invalid CSRF token signature');
    }

    return true;
  }

  /**
   * HMAC 서명된 CSRF 토큰 생성
   * 형식: {random}.{hmac_signature}
   */
  generateSignedToken(): string {
    const random = crypto.randomBytes(32).toString('hex');
    const signature = this.createSignature(random);
    return `${random}.${signature}`;
  }

  /**
   * CSRF 토큰 서명 검증
   */
  private verifyTokenSignature(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 2) {
      // 레거시 토큰 지원 (서명 없는 경우) - CSRF_ALLOW_LEGACY=true 시에만
      if (this.allowLegacyTokens && parts.length === 1 && parts[0].length === 64) {
        return true;
      }
      return false;
    }

    const [random, providedSignature] = parts;
    const expectedSignature = this.createSignature(random);

    // 타이밍 안전 비교 (길이 정보 노출 방지)
    // 항상 고정 길이 비교를 위해 해시 적용
    const sig1 = crypto.createHash('sha256').update(providedSignature).digest();
    const sig2 = crypto.createHash('sha256').update(expectedSignature).digest();

    return crypto.timingSafeEqual(sig1, sig2);
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.csrfSecret)
      .update(data)
      .digest('hex');
  }

  /**
   * CSRF 토큰 생성 (레거시 - 마이그레이션용)
   * @deprecated generateSignedToken() 사용 권장
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
