import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { QueryPatternDto } from './dto/query-pattern.dto';

@Injectable()
export class BrainService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePatternDto) {
    return this.prisma.odBrainPattern.create({
      data: {
        tenantId,
        type: dto.type,
        context: dto.context,
        content: dto.content,
        confidence: dto.confidence ?? 0.8,
        tags: dto.tags || [],
      },
    });
  }

  async findAll(tenantId: string, query: QueryPatternDto) {
    const where: any = { tenantId };
    if (query.type) where.type = query.type;
    if (query.minConfidence) where.confidence = { gte: query.minConfidence };
    if (query.tags) {
      where.tags = { hasSome: query.tags.split(',').map((t) => t.trim()) };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [items, total] = await Promise.all([
      this.prisma.odBrainPattern.findMany({
        where,
        orderBy: { confidence: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.odBrainPattern.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const pattern = await this.prisma.odBrainPattern.findFirst({ where: { id, tenantId } });
    if (!pattern) throw new NotFoundException('Pattern not found');
    return pattern;
  }

  async update(tenantId: string, id: string, dto: UpdatePatternDto) {
    await this.findById(tenantId, id);
    return this.prisma.odBrainPattern.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.odBrainPattern.delete({ where: { id } });
  }

  async matchPattern(tenantId: string, messageContent: string) {
    const keywords = messageContent.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (keywords.length === 0) return null;

    const patterns = await this.prisma.odBrainPattern.findMany({
      where: { tenantId, type: 'SUCCESS_PATTERN' },
      orderBy: { confidence: 'desc' },
      take: 20,
    });

    let bestMatch = null;
    let bestScore = 0;

    for (const pattern of patterns) {
      const patternWords = (pattern.context + ' ' + pattern.content).toLowerCase().split(/\s+/);
      const overlap = keywords.filter((k) => patternWords.some((pw) => pw.includes(k) || k.includes(pw)));
      const score = (overlap.length / keywords.length) * pattern.confidence;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    return bestScore > 0.3 ? { pattern: bestMatch, confidence: bestScore } : null;
  }

  async getInsights(tenantId: string) {
    const [totalPatterns, successCount, failureCount, avgConfidence, topPatterns] = await Promise.all([
      this.prisma.odBrainPattern.count({ where: { tenantId } }),
      this.prisma.odBrainPattern.count({ where: { tenantId, type: 'SUCCESS_PATTERN' } }),
      this.prisma.odBrainPattern.count({ where: { tenantId, type: 'FAILURE_PATTERN' } }),
      this.prisma.odBrainPattern.aggregate({ where: { tenantId }, _avg: { confidence: true } }),
      this.prisma.odBrainPattern.findMany({
        where: { tenantId },
        orderBy: { hitCount: 'desc' },
        take: 5,
      }),
    ]);

    const totalConversations = await this.prisma.odConversation.count({ where: { tenantId } });
    const autoResolved = await this.prisma.odConversation.count({
      where: { tenantId, status: 'RESOLVED' },
    });

    return {
      totalPatterns,
      successCount,
      failureCount,
      avgConfidence: avgConfidence._avg.confidence || 0,
      autoResolveRate: totalConversations > 0 ? autoResolved / totalConversations : 0,
      topPatterns,
    };
  }
}
