import { IsString } from 'class-validator';

export class VerifyChargeDto {
  @IsString()
  impUid: string;

  @IsString()
  merchantUid: string;
}
