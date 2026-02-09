import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'image', 'file'])
  contentType?: string = 'text';
}
