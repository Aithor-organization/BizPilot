/**
 * Pagination DTO
 * 공통 페이지네이션 파라미터 검증
 */
import { IsInt, Min, Max, IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    minimum: 1,
    maximum: 10000,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  @Max(10000, { message: 'page must not exceed 10000' })
  page: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit: number = 20;

  @ApiPropertyOptional({
    description: '정렬 기준 필드 (허용: createdAt, updatedAt, name, id)',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'sortBy must be a string' })
  @IsIn(['createdAt', 'updatedAt', 'name', 'id'], {
    message: 'sortBy must be one of: createdAt, updatedAt, name, id'
  })
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'id';

  @ApiPropertyOptional({
    description: '정렬 방향',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either "asc" or "desc"' })
  sortOrder: 'asc' | 'desc' = 'desc';

  /**
   * Prisma용 skip 계산
   */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Prisma용 take 계산
   */
  get take(): number {
    return this.limit;
  }

  /**
   * Prisma용 orderBy 객체 생성
   */
  getOrderBy(allowedFields: string[]): Record<string, 'asc' | 'desc'> | undefined {
    if (!this.sortBy) return undefined;

    // 허용된 필드만 정렬 가능 (SQL Injection 방지)
    if (!allowedFields.includes(this.sortBy)) {
      return undefined;
    }

    return { [this.sortBy]: this.sortOrder };
  }
}

/**
 * 페이지네이션 응답 메타데이터
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 페이지네이션 응답 래퍼
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * 페이지네이션 응답 생성 헬퍼
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationDto,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
}
