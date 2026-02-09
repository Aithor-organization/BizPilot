/**
 * Security Headers Middleware
 * OWASP 권장 보안 헤더 설정
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // XSS 보호
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // MIME 타입 스니핑 방지
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Clickjacking 방지
    res.setHeader('X-Frame-Options', 'DENY');

    // Referrer 정보 노출 최소화
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HTTPS 강제 (운영 환경)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // Content Security Policy (API 서버용 최소 설정)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'",
    );

    // 서버 정보 숨김
    res.removeHeader('X-Powered-By');

    // 권한 정책 (API 서버 - 카메라, 마이크 등 브라우저 기능 차단)
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    );

    // Cross-Origin 관련 헤더
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    next();
  }
}
