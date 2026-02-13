import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RagService } from '../knowledge/rag.service';
import { LlmService } from '../knowledge/llm.service';
import { CreditService } from '../credit/credit.service';

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
    private ragService: RagService,
    private llmService: LlmService,
    private creditService: CreditService,
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
        // High confidence pattern match - use cached response
        botResponse = matchedPattern.content;
        await this.prisma.odBrainPattern.update({
          where: { id: matchedPattern.id },
          data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
        });
      } else {
        // Low confidence - use RAG + LLM for dynamic response
        const llmResult = await this.generateLlmResponse(tenantId, content, patterns);

        if (llmResult) {
          botResponse = llmResult.response;
          confidence = llmResult.confidence;

          // Deduct credits for LLM usage
          await this.tryDeductCredits(tenantId, 1, 'AI 자동 응답 생성', messageId, 'MESSAGE_AI_RESPONSE');
        } else {
          // Fallback - no LLM available
          botResponse = '감사합니다. 담당자가 곧 연결됩니다. 잠시만 기다려주세요.';
          confidence = 0.3;
        }
      }

      // 4. Create bot message
      await this.prisma.odMessage.create({
        data: {
          conversationId,
          senderType: 'BOT',
          content: botResponse,
          confidence,
        },
      });

      // 5. Handle based on confidence
      if (confidence >= 0.7) {
        this.logger.log(`Auto-responded to ${conversationId} (confidence: ${confidence.toFixed(2)})`);
      } else if (confidence >= 0.5) {
        // Medium confidence - bot responded but flag for agent review
        await this.prisma.odConversation.update({
          where: { id: conversationId },
          data: { status: 'ASSIGNED', priority: 'NORMAL' },
        });
        this.logger.log(`Bot responded with review needed for ${conversationId} (confidence: ${confidence.toFixed(2)})`);
      } else {
        // Low confidence - escalate
        await this.prisma.odConversation.update({
          where: { id: conversationId },
          data: { status: 'ASSIGNED', priority: 'HIGH' },
        });
        this.logger.log(`Escalated ${conversationId} (confidence: ${confidence.toFixed(2)})`);
      }
    } catch (error) {
      this.logger.error(`Failed to process message ${messageId}`, error);
      throw error;
    }
  }

  private async generateLlmResponse(
    tenantId: string,
    query: string,
    brainPatterns: { content: string; confidence: number }[],
  ): Promise<{ response: string; confidence: number } | null> {
    if (!this.llmService.isAvailable) return null;

    try {
      // Search RAG for relevant knowledge
      let ragContext: string[] = [];
      try {
        const ragResults = await this.ragService.search(tenantId, query, 3);
        ragContext = ragResults
          .filter((r) => r.similarity > 0.3)
          .map((r) => r.content);
      } catch {
        // RAG search may fail if no embeddings exist yet
        this.logger.debug('RAG search returned no results or failed');
      }

      // Get relevant brain patterns for context
      const patternContext = brainPatterns
        .filter((p) => p.confidence >= 0.5)
        .slice(0, 3)
        .map((p) => p.content);

      // Generate LLM response
      const result = await this.llmService.generateResponse({
        query,
        ragContext: ragContext.length > 0 ? ragContext : undefined,
        brainPatterns: patternContext.length > 0 ? patternContext : undefined,
      });

      if (!result || !result.content) return null;

      // Calculate confidence based on context availability
      let responseConfidence = 0.6; // Base LLM confidence
      if (ragContext.length > 0) responseConfidence += 0.1; // Boosted by RAG
      if (patternContext.length > 0) responseConfidence += 0.05; // Boosted by patterns

      return {
        response: result.content,
        confidence: Math.min(0.85, responseConfidence),
      };
    } catch (error) {
      this.logger.error('LLM response generation failed', error);
      return null;
    }
  }

  private async tryDeductCredits(
    tenantId: string,
    amount: number,
    description: string,
    referenceId: string,
    referenceType: string,
  ): Promise<void> {
    try {
      await this.creditService.deductCredits(tenantId, amount, description, referenceId, referenceType);
    } catch (error) {
      // Log but don't block the response - credit issues shouldn't prevent customer support
      this.logger.warn(`Credit deduction failed for tenant ${tenantId}: ${(error as Error).message}`);
    }
  }
}
