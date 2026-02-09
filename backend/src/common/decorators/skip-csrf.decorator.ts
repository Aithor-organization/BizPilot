/**
 * Skip CSRF Decorator
 * 웹훅 등 외부 시스템에서 호출하는 API에 사용
 */
import { SetMetadata } from '@nestjs/common';
import { SKIP_CSRF_KEY } from '../guards/csrf.guard';

/**
 * CSRF 검증을 건너뛰는 데코레이터
 * @example
 * @SkipCsrf()
 * @Post('webhook')
 * async handleWebhook() {}
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
