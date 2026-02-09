import { Module } from '@nestjs/common';
import { TenantModule } from './tenant/tenant.module';
import { ChannelModule } from './channel/channel.module';
import { WidgetModule } from './widget/widget.module';
import { ConversationModule } from './conversation/conversation.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { BrainModule } from './brain/brain.module';
import { CreditModule } from './credit/credit.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    TenantModule,
    ChannelModule,
    WidgetModule,
    ConversationModule,
    KnowledgeModule,
    BrainModule,
    CreditModule,
    QueueModule,
  ],
  exports: [
    TenantModule,
    ChannelModule,
    WidgetModule,
    ConversationModule,
    KnowledgeModule,
    BrainModule,
    CreditModule,
  ],
})
export class CsModule {}
