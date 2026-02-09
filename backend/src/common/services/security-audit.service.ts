/**
 * Security Audit Service
 * 보안 관련 이벤트 로깅 및 감사 추적
 */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REUSE_DETECTED'
  | 'PASSWORD_CHANGE'
  | 'API_KEY_CREATED'
  | 'API_KEY_DELETED'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class SecurityAuditService implements OnModuleDestroy {
  private readonly logger = new Logger('SecurityAudit');

  // 메모리 기반 로그인 실패 카운터 (프로덕션에서는 Redis 권장)
  private readonly loginFailures = new Map<string, { count: number; lastAttempt: Date }>();
  private readonly LOCKOUT_THRESHOLD = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15분

  // 정리 interval 참조 (메모리 누수 방지)
  private cleanupInterval: ReturnType<typeof setInterval>;

  // 간단한 락 메커니즘 (Race Condition 완화)
  private readonly pendingOperations = new Map<string, Promise<void>>();

  constructor(private prisma: PrismaService) {
    // 주기적으로 만료된 기록 정리 (1시간마다)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRecords().catch((err) => {
        this.logger.error(`Cleanup failed: ${err}`);
      });
    }, 60 * 60 * 1000);
  }

  /**
   * 모듈 종료 시 정리
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * 보안 이벤트 기록 (콘솔 로그 + DB 저장)
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    const logMessage = this.formatLogMessage(event);

    // 이벤트 유형에 따른 로그 레벨 및 심각도 결정
    let severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

    switch (event.type) {
      case 'LOGIN_SUCCESS':
      case 'TOKEN_REFRESH':
      case 'LOGOUT':
        this.logger.log(logMessage);
        severity = 'INFO';
        break;

      case 'LOGIN_FAILURE':
      case 'PERMISSION_DENIED':
      case 'RATE_LIMIT_EXCEEDED':
        this.logger.warn(logMessage);
        severity = 'WARNING';
        break;

      case 'TOKEN_REUSE_DETECTED':
      case 'SUSPICIOUS_ACTIVITY':
        this.logger.error(logMessage);
        severity = 'CRITICAL';
        break;

      default:
        this.logger.log(logMessage);
        severity = 'INFO';
    }

    // 로그 기록 (콘솔 기반, DB SecurityAuditLog 모델 제거됨)
    this.logger.debug(`Audit: ${event.type} | severity=${severity} | userId=${event.userId || 'N/A'} | ip=${event.ip}`);
  }

  /**
   * 로그인 실패 기록 및 잠금 확인
   * Race Condition 완화를 위한 간단한 락 메커니즘 적용
   */
  async recordLoginFailure(identifier: string, ip: string): Promise<{ isLocked: boolean; remainingAttempts: number }> {
    const key = `${identifier}:${ip}`;

    // 동시 요청 대기 (간단한 락)
    while (this.pendingOperations.has(key)) {
      await this.pendingOperations.get(key);
    }

    // 락 설정
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.pendingOperations.set(key, lockPromise);

    try {
      const now = new Date();
      const record = this.loginFailures.get(key);

      if (record) {
        // 잠금 기간이 지났으면 초기화
        if (now.getTime() - record.lastAttempt.getTime() > this.LOCKOUT_DURATION_MS) {
          this.loginFailures.set(key, { count: 1, lastAttempt: now });
          return { isLocked: false, remainingAttempts: this.LOCKOUT_THRESHOLD - 1 };
        }

        record.count += 1;
        record.lastAttempt = now;
        this.loginFailures.set(key, record);

        const isLocked = record.count >= this.LOCKOUT_THRESHOLD;
        const remainingAttempts = Math.max(0, this.LOCKOUT_THRESHOLD - record.count);

        if (isLocked) {
          await this.logEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            ip,
            details: { reason: 'Account temporarily locked due to multiple failed login attempts', identifier },
          });
        }

        return { isLocked, remainingAttempts };
      }

      this.loginFailures.set(key, { count: 1, lastAttempt: now });
      return { isLocked: false, remainingAttempts: this.LOCKOUT_THRESHOLD - 1 };
    } finally {
      // 락 해제
      this.pendingOperations.delete(key);
      resolveLock!();
    }
  }

  /**
   * 로그인 성공 시 실패 기록 초기화
   */
  clearLoginFailures(identifier: string, ip: string): void {
    const key = `${identifier}:${ip}`;
    this.loginFailures.delete(key);
  }

  /**
   * 계정이 잠겼는지 확인
   */
  isAccountLocked(identifier: string, ip: string): boolean {
    const key = `${identifier}:${ip}`;
    const record = this.loginFailures.get(key);

    if (!record) return false;

    const now = new Date();
    // 잠금 기간이 지났으면 잠기지 않음
    if (now.getTime() - record.lastAttempt.getTime() > this.LOCKOUT_DURATION_MS) {
      return false;
    }

    return record.count >= this.LOCKOUT_THRESHOLD;
  }

  /**
   * 만료된 기록 정리 (메모리 + DB)
   */
  private async cleanupExpiredRecords(): Promise<void> {
    const now = new Date();
    let cleaned = 0;

    // 1. 메모리 기반 로그인 실패 기록 정리
    for (const [key, record] of this.loginFailures.entries()) {
      if (now.getTime() - record.lastAttempt.getTime() > this.LOCKOUT_DURATION_MS) {
        this.loginFailures.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired login failure records`);
    }

  }

  /**
   * 로그 메시지 포맷
   */
  private formatLogMessage(event: SecurityEvent): string {
    const sanitizedDetails = event.details
      ? this.sanitizeDetails(event.details)
      : '';

    const parts = [
      `[${event.type}]`,
      event.userId ? `User: ${event.userId.slice(0, 8)}...` : '',
      `IP: ${event.ip}`,
      event.userAgent ? `UA: ${event.userAgent.slice(0, 50)}` : '',
      sanitizedDetails ? `Details: ${JSON.stringify(sanitizedDetails)}` : '',
    ];

    return parts.filter(Boolean).join(' | ');
  }

  /**
   * 민감 정보 마스킹
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['email', 'identifier', 'password', 'token', 'apiKey', 'secret'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        if (typeof value === 'string') {
          sanitized[key] = this.maskValue(value);
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 값 마스킹 (이메일: u***@domain.com, 일반: 앞3자***뒤3자)
   */
  private maskValue(value: string): string {
    if (value.includes('@')) {
      // 이메일 마스킹
      const [local, domain] = value.split('@');
      return `${local.charAt(0)}***@${domain}`;
    }

    // 일반 문자열 마스킹
    if (value.length <= 6) {
      return '***';
    }
    return `${value.slice(0, 3)}***${value.slice(-3)}`;
  }
}
