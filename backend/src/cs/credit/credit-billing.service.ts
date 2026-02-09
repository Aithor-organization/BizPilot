import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditService } from './credit.service';

@Injectable()
export class CreditBillingService {
  private readonly logger = new Logger(CreditBillingService.name);

  constructor(
    private config: ConfigService,
    private creditService: CreditService,
  ) {}

  async createChargeRequest(tenantId: string, amount: number, userId: string) {
    const merchantUid = `od-credit-${tenantId}-${Date.now()}`;
    const credits = amount; // 1 KRW = 1 credit

    return {
      merchantUid,
      amount,
      credits,
      name: `OmniDesk 크레딧 ${credits}`,
      impKey: this.config.get('PORTONE_IMP_KEY'),
    };
  }

  async verifyAndCharge(tenantId: string, impUid: string, merchantUid: string) {
    // Verify with PortOne
    const impKey = this.config.get('PORTONE_IMP_KEY');
    const impSecret = this.config.get('PORTONE_IMP_SECRET');

    if (!impKey || !impSecret) {
      throw new BadRequestException('Payment configuration not set');
    }

    try {
      // Get access token
      const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.response?.access_token;

      if (!accessToken) {
        throw new BadRequestException('Failed to get payment token');
      }

      // Verify payment
      const paymentRes = await fetch(`https://api.iamport.kr/payments/${impUid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const paymentData = await paymentRes.json();
      const payment = paymentData.response;

      if (!payment || payment.status !== 'paid') {
        throw new BadRequestException('Payment not completed');
      }

      if (payment.merchant_uid !== merchantUid) {
        throw new BadRequestException('Payment merchant UID mismatch');
      }

      // Add credits
      const credits = payment.amount; // 1 KRW = 1 credit
      const result = await this.creditService.addCredits(
        tenantId,
        credits,
        `크레딧 충전 (${payment.amount}원)`,
        impUid,
        'PAYMENT',
      );

      this.logger.log(`Charged ${credits} credits for tenant ${tenantId}`);
      return { ...result, credits };
    } catch (error) {
      this.logger.error('Payment verification failed', error);
      throw error instanceof BadRequestException ? error : new BadRequestException('Payment verification failed');
    }
  }
}
