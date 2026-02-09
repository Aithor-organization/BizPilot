import { IsString, IsOptional, IsArray, MaxLength, IsIn } from 'class-validator';

export class CreateWidgetDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  channelId: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  greeting?: string;

  @IsOptional()
  @IsString()
  @IsIn(['bottom-right', 'bottom-left'])
  position?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];
}
