import { IsString, IsOptional, IsNumber, IsArray, IsIn, Min, Max, MaxLength } from 'class-validator';

export class CreatePatternDto {
  @IsString()
  @IsIn(['SUCCESS_PATTERN', 'FAILURE_PATTERN'])
  type: string;

  @IsString()
  @MaxLength(500)
  context: string;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
