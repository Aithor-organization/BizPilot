import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantMemberGuard } from './guards/tenant-member.guard';
import { TenantOwnerGuard } from './guards/tenant-owner.guard';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantService, TenantMemberGuard, TenantOwnerGuard],
  exports: [TenantService, TenantMemberGuard, TenantOwnerGuard],
})
export class TenantModule {}
