import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

interface DocumentJobData {
  documentId: string;
  tenantId: string;
  buffer: string; // base64
  fileType: string;
}

@Processor('document-ingestion')
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(private prisma: PrismaService) {
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

      // Chunk text (2000 chars per chunk, 200 char overlap ≈ 500 tokens)
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

      // Update document
      await this.prisma.odDocument.update({
        where: { id: documentId },
        data: {
          content: text.slice(0, 50000), // Store first 50K chars
          status: 'READY',
          chunkCount: chunks.length,
        },
      });

      // Embedding will be generated separately by EmbeddingService
      // TODO: Integrate embedding generation here after T-11
      this.logger.log(`Document ${documentId} processed: ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error(`Failed to process document ${documentId}`, error);
      await this.prisma.odDocument.update({
        where: { id: documentId },
        data: { status: 'FAILED', error: (error as Error).message },
      });
      throw error;
    }
  }
}
