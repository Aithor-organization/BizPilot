import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';
import { BrainController } from './brain.controller';
import { BrainService } from './brain.service';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    BullModule.registerQueue({ name: 'brain-learning' }),
  ],
  controllers: [BrainController],
  providers: [BrainService],
  exports: [BrainService],
})
export class BrainModule {}
