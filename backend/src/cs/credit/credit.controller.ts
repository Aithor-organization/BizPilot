import { Body, Controller, Get, Param, Post, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantMemberGuard } from '../tenant/guards/tenant-member.guard';
import { CreditService } from './credit.service';
import { CreditBillingService } from './credit-billing.service';
import { ChargeCreditsDto } from './dto/charge-credits.dto';
import { VerifyChargeDto } from './dto/verify-charge.dto';

@Controller('api/omnidesk/tenants/:tenantId/credits')
@UseGuards(JwtAuthGuard, TenantMemberGuard)
export class CreditController {
  constructor(
    private creditService: CreditService,
    private billingService: CreditBillingService,
  ) {}

  @Get()
  getBalance(@Param('tenantId') tenantId: string) {
    return this.creditService.getBalance(tenantId);
  }

  @Get('transactions')
  getTransactions(
    @Param('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.creditService.getTransactions(tenantId, Number(page) || 1, Number(limit) || 20);
  }

  @Post('charge')
  charge(
    @Param('tenantId') tenantId: string,
    @Body() dto: ChargeCreditsDto,
    @Request() req: any,
  ) {
    return this.billingService.createChargeRequest(tenantId, dto.amount, req.user.id);
  }

  @Post('charge/verify')
  verifyCharge(@Param('tenantId') tenantId: string, @Body() dto: VerifyChargeDto) {
    return this.billingService.verifyAndCharge(tenantId, dto.impUid, dto.merchantUid);
  }
}
