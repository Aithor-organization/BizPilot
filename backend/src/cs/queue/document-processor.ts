import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from '../knowledge/embedding.service';
import { CreditService } from '../credit/credit.service';

interface DocumentJobData {
  documentId: string;
  tenantId: string;
  buffer: string; // base64
  fileType: string;
}

@Processor('document-ingestion')
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
    private creditService: CreditService,
  ) {
    super();
  }

  async process(job: Job<DocumentJobData>): Promise<void> {
    const { documentId, tenantId, buffer, fileType } = job.data;
    this.logger.log(`Processing document ${documentId}`);

    try {
      const fileBuffer = Buffer.from(buffer, 'base64');
      let text = '';

      // Extract text
      if (fileType === 'pdf') {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else {
        text = fileBuffer.toString('utf-8');
      }

      // Chunk text (2000 chars per chunk, 200 char overlap)
      const CHUNK_SIZE = 2000;
      const OVERLAP = 200;
      const chunks: { content: string; index: number }[] = [];

      for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
        const chunk = text.slice(i, i + CHUNK_SIZE).trim();
        if (chunk.length > 50) {
          chunks.push({ content: chunk, index: chunks.length });
        }
      }

      // Save chunks
      await this.prisma.odKnowledgeChunk.createMany({
        data: chunks.map((c) => ({
          documentId,
          tenantId,
          content: c.content,
          chunkIndex: c.index,
          tokenCount: Math.ceil(c.content.length / 4),
        })),
      });

      // Update document status
      await this.prisma.odDocument.update({
        where: { id: documentId },
        data: {
          content: text.slice(0, 50000),
          status: 'READY',
          chunkCount: chunks.length,
        },
      });

      // Generate embeddings for all chunks
      await this.generateEmbeddings(documentId, tenantId, chunks);

      this.logger.log(`Document ${documentId} processed: ${chunks.length} chunks with embeddings`);
    } catch (error) {
      this.logger.error(`Failed to process document ${documentId}`, error);
      await this.prisma.odDocument.update({
        where: { id: documentId },
        data: { status: 'FAILED', error: (error as Error).message },
      });
      throw error;
    }
  }

  private async generateEmbeddings(
    documentId: string,
    tenantId: string,
    chunks: { content: string; index: number }[],
  ): Promise<void> {
    if (chunks.length === 0) return;

    try {
      // Get saved chunk IDs from DB
      const savedChunks = await this.prisma.odKnowledgeChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: 'asc' },
        select: { id: true, content: true },
      });

      if (savedChunks.length === 0) return;

      // Generate embeddings in batches
      const BATCH_SIZE = 20;
      let embeddedCount = 0;

      for (let i = 0; i < savedChunks.length; i += BATCH_SIZE) {
        const batch = savedChunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map((c) => c.content);

        const embeddings = await this.embeddingService.embedTexts(texts);

        // Skip if embedding service is not available
        if (embeddings.length === 0 || embeddings[0].length === 0) {
          this.logger.warn(`Embedding skipped for document ${documentId} - service unavailable`);
          return;
        }

        // Update each chunk with its embedding via raw SQL (Prisma doesn't support vector writes)
        for (let j = 0; j < batch.length; j++) {
          const embeddingStr = `[${embeddings[j].join(',')}]`;
          await this.prisma.$executeRawUnsafe(
            `UPDATE od_knowledge_chunks SET embedding = $1::vector WHERE id = $2`,
            embeddingStr,
            batch[j].id,
          );
          embeddedCount++;
        }

        this.logger.log(
          `Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(savedChunks.length / BATCH_SIZE)} for document ${documentId}`,
        );
      }

      // Deduct credits for embedding generation (1 credit per 10 chunks, minimum 1)
      const creditCost = Math.max(1, Math.ceil(embeddedCount / 10));
      try {
        await this.creditService.deductCredits(
          tenantId,
          creditCost,
          `문서 임베딩 생성 (${embeddedCount}개 청크)`,
          documentId,
          'DOCUMENT_EMBEDDING',
        );
        this.logger.log(`Deducted ${creditCost} credits for document ${documentId} embedding`);
      } catch (creditError) {
        // Don't fail the document processing if credit deduction fails
        this.logger.warn(`Credit deduction failed for document ${documentId}: ${(creditError as Error).message}`);
      }
    } catch (error) {
      // Log but don't fail the entire document processing
      this.logger.error(`Embedding generation failed for document ${documentId}`, error);
    }
  }
}
