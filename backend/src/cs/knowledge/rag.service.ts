import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

interface ChunkResult {
  id: string;
  content: string;
  similarity: number;
  metadata: any;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {}

  async search(tenantId: string, query: string, topK: number = 5): Promise<ChunkResult[]> {
    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingService.embedText(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // 2. Vector similarity search (70% weight)
    const vectorResults: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, content, metadata,
              1 - (embedding <=> $1::vector) as similarity
       FROM od_knowledge_chunks
       WHERE tenant_id = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      embeddingStr,
      tenantId,
      topK * 2,
    );

    // 3. Keyword search (30% weight)
    const keywords = query.split(/\s+/).filter((w) => w.length > 2);
    let keywordResults: any[] = [];
    if (keywords.length > 0) {
      const keywordPattern = keywords.join('|');
      keywordResults = await this.prisma.$queryRawUnsafe(
        `SELECT id, content, metadata, 0.5 as similarity
         FROM od_knowledge_chunks
         WHERE tenant_id = $1 AND content ~* $2
         LIMIT $3`,
        tenantId,
        keywordPattern,
        topK,
      );
    }

    // 4. Merge and deduplicate
    const resultMap = new Map<string, ChunkResult>();

    for (const r of vectorResults) {
      resultMap.set(r.id, {
        id: r.id,
        content: r.content,
        similarity: Number(r.similarity) * 0.7,
        metadata: r.metadata,
      });
    }

    for (const r of keywordResults) {
      const existing = resultMap.get(r.id);
      if (existing) {
        existing.similarity += 0.3 * Number(r.similarity);
      } else {
        resultMap.set(r.id, {
          id: r.id,
          content: r.content,
          similarity: Number(r.similarity) * 0.3,
          metadata: r.metadata,
        });
      }
    }

    // 5. Sort and return top K
    return Array.from(resultMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
