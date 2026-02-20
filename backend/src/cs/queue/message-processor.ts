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
          // Demo template response - keyword-based smart reply
          const templateResult = this.getDemoTemplateResponse(content);
          botResponse = templateResult.response;
          confidence = templateResult.confidence;
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

  private getDemoTemplateResponse(content: string): { response: string; confidence: number } {
    const text = content.toLowerCase();

    const templates: { keywords: string[]; response: string; confidence: number }[] = [
      // 가격/비용 문의
      {
        keywords: ['가격', '얼마', '비용', '요금', '금액', '프라이스', 'price'],
        response:
          '안녕하세요! 블룸 헤어살롱 가격 안내드립니다 😊\n\n' +
          '✂️ 커트: 여성 25,000원 / 남성 18,000원\n' +
          '💇 펌: 80,000원~150,000원 (길이별 상이)\n' +
          '🎨 염색: 70,000원~120,000원\n' +
          '💆 클리닉/케어: 30,000원~80,000원\n\n' +
          '정확한 금액은 모발 상태와 길이에 따라 달라질 수 있어요. 방문 상담 시 자세히 안내해드릴게요!',
        confidence: 0.88,
      },
      // 예약 문의
      {
        keywords: ['예약', '예약하고', '예약할', '예약가능', '부킹', 'booking', '잡고'],
        response:
          '네, 예약 도와드리겠습니다! 😊\n\n' +
          '📅 원하시는 날짜와 시간을 말씀해주시면 바로 확인해드릴게요.\n' +
          '현재 이번 주 평일 오후에 여유가 있습니다.\n\n' +
          '원하시는 시술과 담당 디자이너가 있으시면 함께 알려주세요!\n' +
          '(온라인 예약은 홈페이지에서도 가능합니다)',
        confidence: 0.91,
      },
      // 영업시간
      {
        keywords: ['영업시간', '오픈', '몇시', '운영시간', '언제까지', '마감', '휴무', '쉬는날'],
        response:
          '블룸 헤어살롱 영업시간 안내입니다 🕐\n\n' +
          '📍 평일: 오전 10:00 ~ 오후 8:00\n' +
          '📍 토요일: 오전 10:00 ~ 오후 7:00\n' +
          '📍 일요일: 오전 11:00 ~ 오후 6:00\n' +
          '📍 정기 휴무: 매주 월요일\n\n' +
          '마지막 접수는 마감 1시간 전까지 가능합니다!',
        confidence: 0.92,
      },
      // 커트
      {
        keywords: ['커트', '컷트', '자르', '잘라', '머리카락', '단발', '숏컷', 'cut'],
        response:
          '커트 시술 안내드립니다 ✂️\n\n' +
          '여성 커트: 25,000원 (샴푸+드라이 포함)\n' +
          '남성 커트: 18,000원 (샴푸+드라이 포함)\n' +
          '어린이 커트: 15,000원\n\n' +
          '디자이너와 상담 후 고객님의 얼굴형과 라이프스타일에 맞는 스타일을 제안해드려요. 예약하시겠어요?',
        confidence: 0.87,
      },
      // 펌
      {
        keywords: ['펌', '파마', '웨이브', '볼륨', '셋팅', 'perm'],
        response:
          '펌 시술 안내드립니다 💇‍♀️\n\n' +
          '디지털 펌: 80,000원~\n' +
          '셋팅 펌: 90,000원~\n' +
          '볼륨 매직: 100,000원~\n' +
          '다운 펌 (남성): 40,000원~\n\n' +
          '모발 길이와 상태에 따라 가격이 달라질 수 있어요. 시술 시간은 약 2~3시간 소요됩니다. 예약 도와드릴까요?',
        confidence: 0.86,
      },
      // 염색
      {
        keywords: ['염색', '컬러', '탈색', '색깔', '블리치', '하이라이트', 'color'],
        response:
          '염색 시술 안내드립니다 🎨\n\n' +
          '전체 염색: 70,000원~\n' +
          '뿌리 염색: 50,000원~\n' +
          '하이라이트/발레아쥬: 100,000원~\n' +
          '탈색: 60,000원~/1회\n\n' +
          '현재 트렌드 컬러와 고객님 피부톤에 맞는 색상을 추천해드릴 수 있어요. 상담 예약하시겠어요?',
        confidence: 0.85,
      },
      // 케어/트리트먼트
      {
        keywords: ['케어', '트리트먼트', '클리닉', '손상', '두피', '영양', '관리'],
        response:
          '헤어 케어 프로그램 안내드립니다 💆\n\n' +
          '기본 트리트먼트: 30,000원\n' +
          '프리미엄 클리닉: 50,000원\n' +
          '두피 케어: 40,000원\n' +
          '손상 모발 집중 케어: 80,000원\n\n' +
          '시술 전후 케어를 함께 하시면 10% 할인 혜택이 있어요!',
        confidence: 0.84,
      },
      // 위치/주소/오시는길
      {
        keywords: ['위치', '주소', '어디', '오시는길', '길', '찾아가', '주차', '지하철'],
        response:
          '블룸 헤어살롱 오시는 길 안내입니다 📍\n\n' +
          '주소: 서울시 강남구 역삼동 123-45 블룸빌딩 2층\n' +
          '🚇 지하철: 역삼역 3번 출구에서 도보 3분\n' +
          '🚗 주차: 건물 지하주차장 이용 가능 (2시간 무료)\n\n' +
          '길 찾기 어려우시면 전화주세요! 친절하게 안내해드릴게요 ☺️',
        confidence: 0.90,
      },
      // 인사/감사
      {
        keywords: ['감사', '고마워', '고맙', '잘됐', '좋아', '최고', '만족'],
        response:
          '감사합니다! 😊 블룸 헤어살롱을 찾아주셔서 정말 기쁩니다.\n' +
          '항상 최상의 서비스로 보답하겠습니다.\n\n' +
          '다른 궁금하신 점이 있으시면 언제든 문의해주세요!',
        confidence: 0.82,
      },
      // 인사/안녕
      {
        keywords: ['안녕', '하이', '헬로', 'hello', 'hi', '반갑'],
        response:
          '안녕하세요! 블룸 헤어살롱입니다 🌸\n' +
          '무엇을 도와드릴까요?\n\n' +
          '💇 시술 예약\n' +
          '💰 가격 문의\n' +
          '📍 오시는 길\n' +
          '📞 기타 문의\n\n' +
          '편하게 말씀해주세요!',
        confidence: 0.85,
      },
      // 취소/변경
      {
        keywords: ['취소', '변경', '바꾸', '바꿀', '일정', '미루', '캔슬'],
        response:
          '예약 변경/취소 안내입니다 📋\n\n' +
          '• 예약 변경: 시술 하루 전까지 무료 변경 가능\n' +
          '• 예약 취소: 당일 취소 시 취소 수수료가 발생할 수 있어요\n\n' +
          '변경하실 예약 날짜와 성함을 알려주시면 바로 처리해드리겠습니다!',
        confidence: 0.83,
      },
      // 이벤트/할인
      {
        keywords: ['이벤트', '할인', '프로모션', '쿠폰', '혜택', '특가', '세일'],
        response:
          '현재 진행 중인 이벤트 안내드립니다 🎉\n\n' +
          '🌟 2월 특별 이벤트\n' +
          '• 펌+염색 동시 시술 시 20% 할인\n' +
          '• 신규 고객 첫 방문 15% 할인\n' +
          '• 친구 추천 시 양쪽 모두 10,000원 할인\n\n' +
          '자세한 내용은 예약 시 안내해드릴게요!',
        confidence: 0.86,
      },
    ];

    // 키워드 매칭으로 최적 템플릿 찾기
    let bestMatch: { response: string; confidence: number } | null = null;
    let bestScore = 0;

    for (const template of templates) {
      const matchCount = template.keywords.filter((kw) => text.includes(kw)).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestMatch = { response: template.response, confidence: template.confidence };
      }
    }

    // 매칭된 템플릿이 없으면 기본 응답
    if (!bestMatch || bestScore === 0) {
      return {
        response:
          '안녕하세요, 블룸 헤어살롱입니다! 😊\n' +
          '문의해주셔서 감사합니다.\n\n' +
          '궁금하신 내용을 좀 더 구체적으로 말씀해주시면 빠르게 안내해드리겠습니다.\n' +
          '예약, 가격, 영업시간 등 무엇이든 편하게 물어봐주세요!',
        confidence: 0.75,
      };
    }

    return bestMatch;
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
