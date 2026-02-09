import { IsNumber, Min } from 'class-validator';

export class ChargeCreditsDto {
  @IsNumber()
  @Min(1000)
  amount: number; // KRW
}
