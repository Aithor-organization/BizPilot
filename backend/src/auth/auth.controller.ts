import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 분당 5회
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 409, description: '이미 가입된 이메일' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(
    @Body() dto: RegisterDto,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    const result = await this.authService.register(dto, userAgent, ip);

    // Refresh Token을 httpOnly 쿠키로 설정
    this.setRefreshTokenCookies(res, result.refreshToken, result.tokenFamily);

    // 응답에서 refreshToken 제거 (쿠키로만 전달)
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 분당 10회
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() dto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    const result = await this.authService.login(dto, userAgent, ip);

    // Refresh Token을 httpOnly 쿠키로 설정
    this.setRefreshTokenCookies(res, result.refreshToken, result.tokenFamily);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 분당 20회
  @ApiOperation({ summary: '토큰 갱신 (Refresh Token Rotation)' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token' })
  async refresh(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const tokenFamily = req.cookies?.tokenFamily;

    if (!refreshToken || !tokenFamily) {
      res.status(401).json({ message: 'Refresh token not found' });
      return;
    }

    const result = await this.authService.refresh(
      refreshToken,
      tokenFamily,
      userAgent,
      ip,
    );

    // 새 Refresh Token으로 쿠키 갱신
    this.setRefreshTokenCookies(res, result.refreshToken, result.tokenFamily);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃 (현재 세션)' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const tokenFamily = req.cookies?.tokenFamily;

    if (tokenFamily) {
      await this.authService.logout(tokenFamily);
    }

    // 쿠키 삭제
    this.clearRefreshTokenCookies(res);

    return { message: '로그아웃 되었습니다.' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모든 세션에서 로그아웃' })
  @ApiResponse({ status: 200, description: '모든 세션 로그아웃 성공' })
  async logoutAll(
    @Request() req: { user: { id: string } },
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    await this.authService.logoutAll(req.user.id);

    // 현재 세션 쿠키도 삭제
    this.clearRefreshTokenCookies(res);

    return { message: '모든 세션에서 로그아웃 되었습니다.' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  /**
   * Refresh Token 쿠키 설정
   */
  private setRefreshTokenCookies(
    res: ExpressResponse,
    refreshToken: string,
    tokenFamily: string,
  ): void {
    // Refresh Token (httpOnly - XSS 방어)
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Token Family (httpOnly로 변경 - XSS 방어 강화)
    // 로그아웃은 서버에서 처리하므로 JS 접근 불필요
    res.cookie('tokenFamily', tokenFamily, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  /**
   * Refresh Token 쿠키 삭제
   */
  private clearRefreshTokenCookies(res: ExpressResponse): void {
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('tokenFamily', { path: '/' });
  }
}
