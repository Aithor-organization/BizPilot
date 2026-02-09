import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey, timeout: 5000 });
    } else {
      this.logger.warn('OPENAI_API_KEY not set - embedding features disabled');
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.openai) {
      this.logger.warn('Embedding skipped - OPENAI_API_KEY not configured');
      return [];
    }
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (!this.openai) {
      this.logger.warn('Embedding skipped - OPENAI_API_KEY not configured');
      return texts.map(() => []);
    }
    // Batch in groups of 100
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += 100) {
      const batch = texts.slice(i, i + 100);
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });
      results.push(...response.data.map((d) => d.embedding));
    }
    return results;
  }
}
