/**
 * OAuth Profile Normalization Service
 * ToolJet 패턴 참고 (LP-019):
 * - 다양한 OAuth 제공자의 프로필을 통일된 형식으로 변환
 * - provider, providerId, email, name, profileImage 공통 필드
 * - 이메일 필수 검증
 */
import { Injectable, BadRequestException } from '@nestjs/common';

export type OAuthProvider = 'google' | 'kakao' | 'github' | 'naver';

/**
 * 정규화된 OAuth 프로필 인터페이스
 */
export interface NormalizedOAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  rawProfile: Record<string, unknown>;
}

/**
 * Google OAuth 프로필 (OpenID Connect)
 */
interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Kakao OAuth 프로필
 */
interface KakaoProfile {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
}

/**
 * GitHub OAuth 프로필
 */
interface GitHubProfile {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

/**
 * Naver OAuth 프로필
 */
interface NaverProfile {
  response: {
    id: string;
    email?: string;
    name?: string;
    profile_image?: string;
  };
}

@Injectable()
export class OAuthProfileService {
  /**
   * OAuth 프로필 정규화 (라우터)
   */
  normalize(provider: OAuthProvider, rawProfile: unknown): NormalizedOAuthProfile {
    switch (provider) {
      case 'google':
        return this.normalizeGoogle(rawProfile as GoogleProfile);
      case 'kakao':
        return this.normalizeKakao(rawProfile as KakaoProfile);
      case 'github':
        return this.normalizeGitHub(rawProfile as GitHubProfile);
      case 'naver':
        return this.normalizeNaver(rawProfile as NaverProfile);
      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Google 프로필 정규화
   * - sub → providerId
   * - email (필수)
   * - name, picture (선택)
   */
  private normalizeGoogle(profile: GoogleProfile): NormalizedOAuthProfile {
    if (!profile.email) {
      throw new BadRequestException('Google 계정에 이메일이 없습니다.');
    }

    return {
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name || null,
      profileImage: profile.picture || null,
      rawProfile: profile as unknown as Record<string, unknown>,
    };
  }

  /**
   * Kakao 프로필 정규화
   * - id → providerId (숫자를 문자열로)
   * - kakao_account.email (필수)
   * - properties.nickname 또는 kakao_account.profile.nickname
   */
  private normalizeKakao(profile: KakaoProfile): NormalizedOAuthProfile {
    const email = profile.kakao_account?.email;
    if (!email) {
      throw new BadRequestException(
        'Kakao 계정에 이메일이 없습니다. 카카오 계정 설정에서 이메일 제공에 동의해주세요.',
      );
    }

    const name =
      profile.kakao_account?.profile?.nickname ||
      profile.properties?.nickname ||
      null;

    const profileImage =
      profile.kakao_account?.profile?.profile_image_url ||
      profile.properties?.profile_image ||
      null;

    return {
      provider: 'kakao',
      providerId: String(profile.id),
      email,
      name,
      profileImage,
      rawProfile: profile as unknown as Record<string, unknown>,
    };
  }

  /**
   * GitHub 프로필 정규화
   * - id → providerId (숫자를 문자열로)
   * - email (GitHub 설정에서 public 이메일 필요)
   */
  private normalizeGitHub(profile: GitHubProfile): NormalizedOAuthProfile {
    if (!profile.email) {
      throw new BadRequestException(
        'GitHub 계정에 public 이메일이 없습니다. GitHub 설정에서 이메일을 공개로 설정해주세요.',
      );
    }

    return {
      provider: 'github',
      providerId: String(profile.id),
      email: profile.email,
      name: profile.name || profile.login,
      profileImage: profile.avatar_url,
      rawProfile: profile as unknown as Record<string, unknown>,
    };
  }

  /**
   * Naver 프로필 정규화
   * - response.id → providerId
   * - response.email (필수)
   */
  private normalizeNaver(profile: NaverProfile): NormalizedOAuthProfile {
    const data = profile.response;

    if (!data.email) {
      throw new BadRequestException(
        '네이버 계정에 이메일이 없습니다. 네이버 계정 설정에서 이메일 제공에 동의해주세요.',
      );
    }

    return {
      provider: 'naver',
      providerId: data.id,
      email: data.email,
      name: data.name || null,
      profileImage: data.profile_image || null,
      rawProfile: profile as unknown as Record<string, unknown>,
    };
  }
}
