import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessageProcessor } from './message-processor';
import { DocumentProcessor } from './document-processor';
import { BrainLearner } from './brain-learner';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get('REDIS_URL', 'redis://localhost:6379');
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: 'message-processing' },
      { name: 'document-ingestion' },
      { name: 'brain-learning' },
    ),
  ],
  providers: [MessageProcessor, DocumentProcessor, BrainLearner],
  exports: [BullModule],
})
export class QueueModule {}
