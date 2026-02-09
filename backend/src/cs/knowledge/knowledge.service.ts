import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class KnowledgeService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('document-ingestion') private documentQueue: Queue,
  ) {}

  async uploadDocument(tenantId: string, title: string, file: Express.Multer.File) {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'md'].includes(ext || '')) {
      throw new BadRequestException('Only PDF, TXT, MD files are allowed');
    }

    const document = await this.prisma.odDocument.create({
      data: {
        tenantId,
        title,
        fileName: file.originalname,
        fileType: ext || 'txt',
        fileSize: file.size,
        status: 'PROCESSING',
      },
    });

    // Enqueue for processing
    await this.documentQueue.add('process-document', {
      documentId: document.id,
      tenantId,
      buffer: file.buffer.toString('base64'),
      fileType: ext,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return document;
  }

  async findAll(tenantId: string) {
    return this.prisma.odDocument.findMany({
      where: { tenantId },
      include: { _count: { select: { chunks: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const doc = await this.prisma.odDocument.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { chunks: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.odDocument.delete({ where: { id } });
  }
}
