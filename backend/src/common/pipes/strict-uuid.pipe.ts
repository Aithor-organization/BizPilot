/**
 * Strict UUID Validation Pipe
 * UUID v4 형식 검증 (SQL Injection 방지 효과)
 */
import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

// UUID v4 정규식
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class StrictUuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException(
        `${metadata.data || 'ID'}는 유효한 UUID 형식이어야 합니다.`,
      );
    }

    const trimmed = value.trim();

    if (!UUID_V4_REGEX.test(trimmed)) {
      throw new BadRequestException(
        `${metadata.data || 'ID'}는 유효한 UUID v4 형식이어야 합니다.`,
      );
    }

    // 소문자 정규화하여 반환
    return trimmed.toLowerCase();
  }
}
