/**
 * IP-based Throttle Guard
 * IP 기반으로 요청 횟수 제한 (DDoS/브루트포스 방지)
 */
import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class IpThrottleGuard extends ThrottlerGuard {
  // TRUST_PROXY 환경변수로 X-Forwarded-For 신뢰 여부 제어
  // 프록시/로드밸런서 뒤에서 운영 시에만 true로 설정
  private trustProxy = false;

  @Inject(ConfigService)
  private readonly configService!: ConfigService;

  async onModuleInit(): Promise<void> {
    this.trustProxy = this.configService.get<boolean>('TRUST_PROXY') === true;
  }

  /**
   * IP 주소 추출 (프록시 환경 고려, TRUST_PROXY=true 시에만 헤더 신뢰)
   */
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // TRUST_PROXY가 false면 직접 연결 IP만 사용 (IP Spoofing 방지)
    if (!this.trustProxy) {
      return (req.ip as string) || 'unknown';
    }

    const headers = req.headers as Record<string, string | string[]>;

    // X-Forwarded-For 헤더에서 실제 클라이언트 IP 추출
    const forwardedFor = headers['x-forwarded-for'];
    if (forwardedFor) {
      // 첫 번째 IP가 실제 클라이언트 IP
      const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',');
      return ips[0].trim();
    }

    // X-Real-IP 헤더 (Nginx)
    const realIp = headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // 기본 IP (req.ip는 Express Request 타입에서 제공)
    return (req.ip as string) || 'unknown';
  }

  /**
   * 에러 메시지 커스터마이징
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    throttlerLimitDetail: { limit: number; ttl: number; key: string; tracker: string; totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }
  ): Promise<void> {
    throw new ThrottlerException(
      '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    );
  }
}
