import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface LlmResponseOptions {
  query: string;
  ragContext?: string[];
  brainPatterns?: string[];
  systemPrompt?: string;
}

interface LlmResponse {
  content: string;
  tokensUsed: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private openai: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey, timeout: 30000 });
    } else {
      this.logger.warn('OPENAI_API_KEY not set - LLM features disabled');
    }
  }

  get isAvailable(): boolean {
    return this.openai !== null;
  }

  async generateResponse(options: LlmResponseOptions): Promise<LlmResponse | null> {
    if (!this.openai) {
      this.logger.warn('LLM response skipped - OPENAI_API_KEY not configured');
      return null;
    }

    const systemPrompt =
      options.systemPrompt ||
      `당신은 BizPilot 고객 지원 AI 어시스턴트입니다.
고객의 질문에 친절하고 정확하게 답변해주세요.

규칙:
- 한국어로 답변합니다.
- 확실하지 않은 정보는 "담당자에게 확인 후 안내드리겠습니다"라고 말합니다.
- 간결하고 명확하게 답변합니다 (200자 이내 권장).
- 고객을 존중하는 어조를 유지합니다.`;

    const userContent = this.buildUserPrompt(options);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content?.trim() || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      return { content, tokensUsed };
    } catch (error) {
      this.logger.error('LLM generation failed', error);
      return null;
    }
  }

  private buildUserPrompt(options: LlmResponseOptions): string {
    const parts: string[] = [];

    if (options.ragContext && options.ragContext.length > 0) {
      parts.push('참고 자료:');
      options.ragContext.forEach((ctx, i) => {
        parts.push(`[${i + 1}] ${ctx.slice(0, 500)}`);
      });
      parts.push('');
    }

    if (options.brainPatterns && options.brainPatterns.length > 0) {
      parts.push('이전 성공 응답 참고:');
      options.brainPatterns.forEach((p) => {
        parts.push(`- ${p.slice(0, 200)}`);
      });
      parts.push('');
    }

    parts.push(`고객 질문: ${options.query}`);

    return parts.join('\n');
  }
}
