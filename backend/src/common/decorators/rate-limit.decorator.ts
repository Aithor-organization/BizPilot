/**
 * Rate Limit Decorator
 * 경로별 요청 제한을 위한 커스텀 데코레이터
 */
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  // 시간 창 (밀리초)
  ttl: number;
  // 허용 요청 수
  limit: number;
  // 에러 메시지
  message?: string;
}

/**
 * 경로별 Rate Limit 설정
 * @example
 * @RateLimit({ ttl: 60000, limit: 5 }) // 1분당 5회
 * @Post('login')
 * async login() {}
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * 민감한 작업용 프리셋 (1분당 5회)
 */
export const RateLimitSensitive = () =>
  RateLimit({
    ttl: 60000, // 1분
    limit: 5,
    message: '너무 많은 요청입니다. 1분 후 다시 시도해 주세요.',
  });

/**
 * 인증 관련 프리셋 (1분당 3회)
 */
export const RateLimitAuth = () =>
  RateLimit({
    ttl: 60000, // 1분
    limit: 3,
    message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  });

/**
 * 결제 관련 프리셋 (1분당 2회)
 */
export const RateLimitPayment = () =>
  RateLimit({
    ttl: 60000, // 1분
    limit: 2,
    message: '결제 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  });

/**
 * API 호출용 프리셋 (1분당 30회)
 */
export const RateLimitApi = () =>
  RateLimit({
    ttl: 60000, // 1분
    limit: 30,
    message: 'API 요청 한도를 초과했습니다.',
  });
