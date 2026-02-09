import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }

    // ENCRYPTION_SALT 필수 검증 (운영 환경)
    const salt = this.configService.get<string>('ENCRYPTION_SALT');
    if (!salt) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_SALT is required in production environment');
      }
      // 개발/테스트 환경에서는 경고 후 기본값 사용
      console.warn(
        'ENCRYPTION_SALT not set - using development fallback. DO NOT use in production!',
      );
    }

    // Salt 유효성 검증 (최소 16자)
    const effectiveSalt = salt || `dev-salt-${encryptionKey.slice(0, 8)}`;
    if (effectiveSalt.length < 16) {
      throw new Error('ENCRYPTION_SALT must be at least 16 characters');
    }

    // Derive a 32-byte key using scrypt (memory-hard KDF)
    this.key = crypto.scryptSync(encryptionKey, effectiveSalt, 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * API 키의 마지막 4자리만 보여주는 힌트 생성
   */
  getKeyHint(apiKey: string): string {
    if (apiKey.length <= 4) {
      return '****';
    }
    return `****${apiKey.slice(-4)}`;
  }
}
