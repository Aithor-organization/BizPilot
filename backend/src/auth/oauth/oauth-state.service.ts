/**
 * OAuth State Service (CSRF Protection)
 * ToolJet 패턴 참고 (LP-018):
 * - state 파라미터: crypto.randomBytes(32)로 생성
 * - TTL 설정: 10분 후 자동 만료
 * - 일회용 사용: 검증 후 즉시 삭제
 * - redirectTo 추적: 원래 리다이렉트 URL 저장
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface OAuthStateData {
  state: string;
  provider: string;
  redirectTo?: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class OAuthStateService {
  private readonly logger = new Logger(OAuthStateService.name);

  /**
   * 인메모리 상태 저장소
   * 프로덕션에서는 Redis 사용 권장
   */
  private stateStore: Map<string, OAuthStateData> = new Map();

  /**
   * State TTL (10분)
   */
  private readonly STATE_TTL_MS = 10 * 60 * 1000;

  /**
   * OAuth state 생성 (CSRF 방지)
   * @param provider OAuth 제공자 (google, kakao 등)
   * @param redirectTo 인증 후 리다이렉트할 URL (선택)
   */
  generateState(provider: string, redirectTo?: string): string {
    // 32바이트 = 256비트 랜덤 (충분히 안전)
    const state = crypto.randomBytes(32).toString('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.STATE_TTL_MS);

    const stateData: OAuthStateData = {
      state,
      provider,
      redirectTo,
      createdAt: now,
      expiresAt,
    };

    this.stateStore.set(state, stateData);

    // 만료된 state 정리 (가비지 컬렉션)
    this.cleanupExpiredStates();

    this.logger.debug(`OAuth state 생성: provider=${provider}, state=${state.slice(0, 8)}...`);

    return state;
  }

  /**
   * OAuth state 검증 (일회용)
   * @param state 검증할 state 값
   * @param provider 예상 OAuth 제공자
   * @returns 검증된 state 데이터 (redirectTo 포함)
   * @throws 유효하지 않거나 만료된 state
   */
  verifyState(state: string, provider: string): OAuthStateData {
    const stateData = this.stateStore.get(state);

    if (!stateData) {
      this.logger.warn(`OAuth state 없음: state=${state.slice(0, 8)}...`);
      throw new BadRequestException('유효하지 않은 OAuth state입니다. 다시 시도해주세요.');
    }

    // 만료 확인
    if (new Date() > stateData.expiresAt) {
      this.stateStore.delete(state);
      this.logger.warn(`OAuth state 만료: state=${state.slice(0, 8)}...`);
      throw new BadRequestException('OAuth 인증 시간이 초과되었습니다. 다시 시도해주세요.');
    }

    // Provider 일치 확인
    if (stateData.provider !== provider) {
      this.stateStore.delete(state);
      this.logger.warn(
        `OAuth provider 불일치: expected=${stateData.provider}, got=${provider}`,
      );
      throw new BadRequestException('OAuth provider가 일치하지 않습니다.');
    }

    // 일회용: 검증 후 즉시 삭제 (재사용 방지)
    this.stateStore.delete(state);

    this.logger.debug(`OAuth state 검증 성공: provider=${provider}`);

    return stateData;
  }

  /**
   * 만료된 state 정리
   */
  private cleanupExpiredStates(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [state, data] of this.stateStore.entries()) {
      if (now > data.expiresAt) {
        this.stateStore.delete(state);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`만료된 OAuth state ${cleanedCount}개 정리됨`);
    }
  }

  /**
   * Authorization URL 생성 헬퍼
   * @param baseAuthUrl OAuth 제공자의 인증 URL
   * @param clientId 클라이언트 ID
   * @param redirectUri 콜백 URL
   * @param scopes 요청할 스코프
   * @param provider OAuth 제공자
   * @param redirectTo 인증 후 최종 리다이렉트 URL
   */
  buildAuthorizationUrl(params: {
    baseAuthUrl: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
    provider: string;
    redirectTo?: string;
  }): string {
    const state = this.generateState(params.provider, params.redirectTo);

    const url = new URL(params.baseAuthUrl);
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', params.scopes.join(' '));
    url.searchParams.set('state', state);

    // Provider별 추가 파라미터
    if (params.provider === 'google') {
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
    }

    return url.toString();
  }
}
