import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  validateSync,
  Min,
  Max,
  MinLength,
  Matches,
} from 'class-validator';

export class EnvironmentVariables {
  // Environment
  @IsOptional()
  @IsString()
  NODE_ENV?: string = 'development';

  // Database (필수)
  @IsString()
  DATABASE_URL: string;

  // JWT (필수)
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters for security' })
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string = '7d';

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string = '15m';

  // Redis
  @IsOptional()
  @IsString()
  REDIS_URL?: string = 'redis://localhost:6379';

  // Server
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  BACKEND_PORT?: number = 4000;

  // OmniDesk - OpenAI
  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  // OmniDesk - LLM
  @IsOptional()
  @IsString()
  OMNIDESK_LLM_PROVIDER?: string = 'openai';

  @IsOptional()
  @IsString()
  OMNIDESK_LLM_MODEL?: string = 'gpt-4o-mini';

  // Encryption (운영 환경 필수)
  @IsOptional()
  @IsString()
  @MinLength(32, { message: 'ENCRYPTION_KEY must be at least 32 characters' })
  ENCRYPTION_KEY?: string;

  // CSRF Protection (운영 환경 필수)
  @IsOptional()
  @IsString()
  @MinLength(32, { message: 'CSRF_SECRET must be at least 32 characters' })
  CSRF_SECRET?: string;

  @IsOptional()
  @IsBoolean()
  CSRF_ENABLED?: boolean;

  // Rate Limiting
  @IsOptional()
  @IsBoolean()
  TRUST_PROXY?: boolean = false;

  // Frontend URL (CORS)
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\//, { message: 'FRONTEND_URL must be a valid URL' })
  FRONTEND_URL?: string = 'http://localhost:3000';

  // bcrypt rounds (보안 vs 성능 트레이드오프)
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(14)
  BCRYPT_ROUNDS?: number = 12;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = Object.values(error.constraints || {}).join(', ');
      return `${error.property}: ${constraints}`;
    });

    throw new Error(
      `\n\n🚨 Environment Validation Failed:\n${errorMessages.map((m) => `  - ${m}`).join('\n')}\n\nPlease check your .env file.\n`,
    );
  }

  const isProduction = validatedConfig.NODE_ENV === 'production';

  // 운영 환경 필수 검증
  if (isProduction) {
    const productionErrors: string[] = [];

    if (!validatedConfig.ENCRYPTION_KEY || validatedConfig.ENCRYPTION_KEY.length < 32) {
      productionErrors.push('ENCRYPTION_KEY must be at least 32 characters in production');
    }

    if (!validatedConfig.CSRF_SECRET || validatedConfig.CSRF_SECRET.length < 32) {
      productionErrors.push('CSRF_SECRET must be at least 32 characters in production');
    }

    if (validatedConfig.FRONTEND_URL?.includes('localhost')) {
      productionErrors.push('FRONTEND_URL should not contain localhost in production');
    }

    if (productionErrors.length > 0) {
      throw new Error(
        `\n\n🚨 Production Environment Security Check Failed:\n${productionErrors.map((m) => `  - ${m}`).join('\n')}\n`,
      );
    }
  }

  // 경고 출력 (선택적 환경변수)
  const warnings: string[] = [];

  if (!validatedConfig.ENCRYPTION_KEY) {
    warnings.push('ENCRYPTION_KEY not set - using default (NOT SECURE for production)');
  }

  if (!validatedConfig.CSRF_SECRET && !isProduction) {
    warnings.push('CSRF_SECRET not set - CSRF protection disabled in development');
  }

  if (validatedConfig.FRONTEND_URL?.startsWith('http://') && !validatedConfig.FRONTEND_URL.includes('localhost')) {
    warnings.push('FRONTEND_URL uses HTTP - consider using HTTPS for security');
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Configuration Warnings:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn('');
  }

  return validatedConfig;
}
