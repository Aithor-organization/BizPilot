import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { CreditBillingService } from './credit-billing.service';

@Module({
  imports: [PrismaModule, TenantModule],
  controllers: [CreditController],
  providers: [CreditService, CreditBillingService],
  exports: [CreditService, CreditBillingService],
})
export class CreditModule {}
