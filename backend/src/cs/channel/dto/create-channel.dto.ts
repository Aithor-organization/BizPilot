import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsIn(['WEB_CHAT', 'EMAIL', 'SLACK', 'KAKAO'])
  type: string;

  @IsOptional()
  config?: Record<string, unknown>;
}
