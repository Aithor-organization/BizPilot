import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';
import { WidgetController } from './widget.controller';
import { WidgetPublicController } from './widget-public.controller';
import { WidgetService } from './widget.service';
import { WidgetGateway } from './widget.gateway';
import { WidgetTokenGuard } from './guards/widget-token.guard';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    BullModule.registerQueue({ name: 'message-processing' }),
  ],
  controllers: [WidgetController, WidgetPublicController],
  providers: [WidgetService, WidgetGateway, WidgetTokenGuard],
  exports: [WidgetService, WidgetGateway],
})
export class WidgetModule {}
