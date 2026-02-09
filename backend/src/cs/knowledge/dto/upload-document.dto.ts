import { IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @MaxLength(200)
  title: string;
}
