import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';
import { LlmService } from './llm.service';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    ConfigModule,
    BullModule.registerQueue({ name: 'document-ingestion' }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, EmbeddingService, RagService, LlmService],
  exports: [KnowledgeService, EmbeddingService, RagService, LlmService],
})
export class KnowledgeModule {}
