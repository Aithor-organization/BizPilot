import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    BullModule.registerQueue({ name: 'document-ingestion' }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, EmbeddingService, RagService],
  exports: [KnowledgeService, EmbeddingService, RagService],
})
export class KnowledgeModule {}
