import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

interface BrainLearningJobData {
  conversationId: string;
  tenantId: string;
}

@Processor('brain-learning')
export class BrainLearner extends WorkerHost {
  private readonly logger = new Logger(BrainLearner.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<BrainLearningJobData>): Promise<void> {
    const { conversationId, tenantId } = job.data;
    this.logger.log(`Learning from conversation ${conversationId}`);

    const conversation = await this.prisma.odConversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation || conversation.messages.length < 2) return;

    const hasAgentMessages = conversation.messages.some((m) => m.senderType === 'AGENT');
    const hasBotMessages = conversation.messages.some((m) => m.senderType === 'BOT');
    const visitorMessages = conversation.messages.filter((m) => m.senderType === 'VISITOR');
    const context = visitorMessages.map((m) => m.content).join(' ').slice(0, 500);

    let type: string;
    let content: string;
    let confidence: number;

    if (conversation.status === 'RESOLVED' && hasBotMessages && !hasAgentMessages) {
      // Bot resolved without human help
      type = 'SUCCESS_PATTERN';
      const botResponse = conversation.messages.find((m) => m.senderType === 'BOT');
      content = botResponse?.content || '';
      confidence = 0.85;
    } else if (hasAgentMessages) {
      // Agent had to step in
      const agentResponse = conversation.messages.filter((m) => m.senderType === 'AGENT').pop();
      if (conversation.status === 'RESOLVED') {
        // Agent resolved - learn from agent's response
        type = 'SUCCESS_PATTERN';
        content = agentResponse?.content || '';
        confidence = 0.75;
      } else {
        type = 'FAILURE_PATTERN';
        content = `에스컬레이션됨: ${context.slice(0, 200)}`;
        confidence = 0.9;
      }
    } else {
      return; // Not enough data to learn
    }

    // Check for duplicate patterns
    const existingPatterns = await this.prisma.odBrainPattern.findMany({
      where: { tenantId, type },
      take: 50,
    });

    const contextKeywords = context.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    for (const existing of existingPatterns) {
      const existingKeywords = existing.context.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const overlap = contextKeywords.filter((k) => existingKeywords.includes(k));
      const similarity = contextKeywords.length > 0 ? overlap.length / contextKeywords.length : 0;

      if (similarity > 0.6) {
        // Update existing pattern confidence
        const newConfidence = Math.min(1, (existing.confidence + confidence) / 2 + 0.05);
        await this.prisma.odBrainPattern.update({
          where: { id: existing.id },
          data: {
            confidence: newConfidence,
            hitCount: { increment: 1 },
            lastHitAt: new Date(),
          },
        });
        this.logger.log(`Updated existing pattern ${existing.id} confidence to ${newConfidence}`);
        return;
      }
    }

    // Create new pattern
    await this.prisma.odBrainPattern.create({
      data: {
        tenantId,
        type,
        context,
        content,
        confidence,
        sourceConversationId: conversationId,
      },
    });

    this.logger.log(`Created new ${type} for conversation ${conversationId}`);
  }
}
