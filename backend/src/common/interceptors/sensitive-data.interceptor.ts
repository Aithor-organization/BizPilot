/**
 * Sensitive Data Interceptor
 * 요청/응답에서 민감한 데이터를 마스킹하여 로깅
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// 마스킹할 필드 목록 (완전 마스킹)
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'accessToken',
  'apiKey',
  'encryptedKey',
  'secret',
  'impSecret',
  'webhookSecret',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'authorization',
  // 추가된 민감 필드
  'privateKey',
  'private_key',
  'otp',
  'totp',
  'mfa',
  'sessionId',
  'session_id',
  'pin',
  'passcode',
  'socialSecurityNumber',
  'bankAccount',
  'iban',
  'bearer',
  'jwt',
  'cookie',
  'x-api-key',
  'idNumber',
  'driverLicense',
];

// 부분 마스킹 필드 (앞 4자리만 표시)
const PARTIAL_MASK_FIELDS = ['email', 'phone', 'ipAddress', 'ip'];

@Injectable()
export class SensitiveDataInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip } = request;

    // 요청 로깅 (민감 데이터 마스킹)
    const sanitizedBody = this.maskSensitiveData(body);
    this.logger.log(
      `[${method}] ${url} - IP: ${ip} - Body: ${JSON.stringify(sanitizedBody)}`,
    );

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          // 응답 로깅 (민감 데이터 마스킹)
          const sanitizedResponse = this.maskSensitiveData(data);
          const duration = Date.now() - now;
          this.logger.log(
            `[${method}] ${url} - ${duration}ms - Response: ${JSON.stringify(sanitizedResponse).slice(0, 500)}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `[${method}] ${url} - ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }

  /**
   * 객체에서 민감한 데이터 마스킹
   */
  private maskSensitiveData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    const masked: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const value = obj[key];

      // 완전 마스킹
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
        masked[key] = '[REDACTED]';
        continue;
      }

      // 부분 마스킹
      if (PARTIAL_MASK_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
        if (typeof value === 'string' && value.length > 4) {
          masked[key] = value.slice(0, 4) + '****';
        } else {
          masked[key] = '[REDACTED]';
        }
        continue;
      }

      // 중첩 객체 처리
      if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }
}
