import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

interface MessageJobData {
  messageId: string;
  conversationId: string;
  tenantId: string;
  content: string;
}

@Processor('message-processing')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('brain-learning') private brainQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<MessageJobData>): Promise<void> {
    const { messageId, conversationId, tenantId, content } = job.data;
    this.logger.log(`Processing message ${messageId} for tenant ${tenantId}`);

    try {
      // 1. Search Brain patterns
      const patterns = await this.prisma.odBrainPattern.findMany({
        where: {
          tenantId,
          type: 'SUCCESS_PATTERN',
        },
        orderBy: { confidence: 'desc' },
        take: 10,
      });

      // 2. Calculate confidence from pattern matching
      let confidence = 0;
      let matchedPattern = null;
      const keywords = content.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

      for (const pattern of patterns) {
        const patternKeywords = pattern.context.toLowerCase().split(/\s+/);
        const overlap = keywords.filter((k) => patternKeywords.some((pk) => pk.includes(k) || k.includes(pk)));
        const score = keywords.length > 0 ? (overlap.length / keywords.length) * pattern.confidence : 0;
        if (score > confidence) {
          confidence = score;
          matchedPattern = pattern;
        }
      }

      // 3. Generate response
      let botResponse: string;
      if (matchedPattern && confidence >= 0.7) {
        botResponse = matchedPattern.content;
        // Update pattern hit count
        await this.prisma.odBrainPattern.update({
          where: { id: matchedPattern.id },
          data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
        });
      } else {
        // Placeholder - will be replaced with LLM/RAG integration
        botResponse = '감사합니다. 담당자가 곧 연결됩니다. 잠시만 기다려주세요.';
        confidence = 0.3;
      }

      // 4. Create bot message
      const botMessage = await this.prisma.odMessage.create({
        data: {
          conversationId,
          senderType: 'BOT',
          content: botResponse,
          confidence,
        },
      });

      // 5. Handle based on confidence
      if (confidence >= 0.7) {
        this.logger.log(`Auto-responded to ${conversationId} (confidence: ${confidence})`);
      } else {
        // Escalate
        await this.prisma.odConversation.update({
          where: { id: conversationId },
          data: { status: 'ASSIGNED', priority: confidence < 0.3 ? 'HIGH' : 'NORMAL' },
        });
        this.logger.log(`Escalated ${conversationId} (confidence: ${confidence})`);
      }

      // 6. Deduct credits (placeholder - will be integrated with CreditService)
      // TODO: Integrate with T-15

    } catch (error) {
      this.logger.error(`Failed to process message ${messageId}`, error);
      throw error;
    }
  }
}
