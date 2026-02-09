/**
 * API Client Service
 * ToolJet REST API 플러그인 패턴 참고:
 * - 타입별 타임아웃 (일반/업로드/백그라운드)
 * - OAuth2 / Bearer / Basic 인증 지원
 * - SSL 인증서 옵션
 * - 재시도 로직
 */
import { Injectable, Logger } from '@nestjs/common';

export const ApiTimeout = {
  /** 일반 API 호출 - 5초 */
  DEFAULT: 5000,
  /** 파일 업로드 - 30초 */
  UPLOAD: 30000,
  /** 백그라운드/배치 작업 - 60초 */
  BACKGROUND: 60000,
  /** 워크플로우 실행 - 120초 */
  WORKFLOW: 120000,
} as const;

export type ApiTimeoutType = (typeof ApiTimeout)[keyof typeof ApiTimeout];

export interface ApiRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth2';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    clientId?: string;
    clientSecret?: string;
    accessTokenUrl?: string;
    scopes?: string[];
  };
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  duration: number;
}

@Injectable()
export class ApiClientService {
  private readonly logger = new Logger(ApiClientService.name);

  /**
   * API 요청 실행 (타임아웃 + 재시도 + 인증)
   */
  async request<T = unknown>(
    config: ApiRequestConfig,
    auth?: ApiAuthConfig,
  ): Promise<ApiResponse<T>> {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = ApiTimeout.DEFAULT,
      retries = 0,
      retryDelay = 1000,
    } = config;

    // 인증 헤더 추가
    const authHeaders = auth ? await this.buildAuthHeaders(auth) : {};
    const finalHeaders = { ...headers, ...authHeaders };

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...finalHeaders,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as T;

        return {
          data,
          status: response.status,
          headers: responseHeaders,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          this.logger.warn(
            `API 요청 실패 (시도 ${attempt + 1}/${retries + 1}): ${lastError.message}`,
          );
          await this.delay(retryDelay * (attempt + 1)); // 지수 백오프
        }
      }
    }

    throw lastError || new Error('Unknown error');
  }

  /**
   * 인증 헤더 생성
   */
  private async buildAuthHeaders(auth: ApiAuthConfig): Promise<Record<string, string>> {
    switch (auth.type) {
      case 'basic': {
        const { username = '', password = '' } = auth.credentials || {};
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        return { Authorization: `Basic ${encoded}` };
      }

      case 'bearer': {
        const { token = '' } = auth.credentials || {};
        return { Authorization: `Bearer ${token}` };
      }

      case 'oauth2': {
        const token = await this.getOAuth2Token(auth.credentials || {});
        return { Authorization: `Bearer ${token}` };
      }

      default:
        return {};
    }
  }

  /**
   * OAuth2 Client Credentials Flow
   * ToolJet 패턴: Access Token URL로 토큰 요청
   */
  private async getOAuth2Token(credentials: NonNullable<ApiAuthConfig['credentials']>): Promise<string> {
    const {
      clientId = '',
      clientSecret = '',
      accessTokenUrl = '',
      scopes = [],
    } = credentials;

    if (!accessTokenUrl) {
      throw new Error('OAuth2: accessTokenUrl is required');
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    if (scopes.length > 0) {
      params.append('scope', scopes.join(' '));
    }

    // OAuth2 토큰 요청에도 타임아웃 적용 (LP-002 패턴)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ApiTimeout.DEFAULT);

    try {
      const response = await fetch(accessTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth2 token error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as { access_token: string };
      return data.access_token;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OAuth2 token request timeout (${ApiTimeout.DEFAULT}ms)`);
      }
      throw error;
    }
  }

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
