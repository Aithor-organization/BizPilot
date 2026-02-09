import { IsString, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertBusinessProfileDto {
  @ApiProperty({ description: '상호명' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ description: '대표자명' })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({ description: '사업자등록번호' })
  @IsOptional()
  @IsString()
  bizNumber?: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '대표 전화번호' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '영업 시작 시간', example: '09:00' })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiPropertyOptional({ description: '영업 종료 시간', example: '18:00' })
  @IsOptional()
  @IsString()
  closeTime?: string;

  @ApiPropertyOptional({ description: '휴무일 (0=일, 6=토)', example: [0, 6] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  closedDays?: number[];

  @ApiPropertyOptional({ description: '통화', default: 'KRW' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: '타임존', default: 'Asia/Seoul' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: '업종별 추가 설정 (JSON)' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
