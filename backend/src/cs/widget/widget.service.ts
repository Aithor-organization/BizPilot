import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import * as crypto from 'crypto';

@Injectable()
export class WidgetService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateWidgetDto) {
    const embedToken = crypto.randomBytes(32).toString('hex');
    return this.prisma.odWidget.create({
      data: {
        tenantId,
        channelId: dto.channelId,
        name: dto.name,
        embedToken,
        primaryColor: dto.primaryColor || '#4F46E5',
        greeting: dto.greeting || '안녕하세요! 무엇을 도와드릴까요?',
        position: dto.position || 'bottom-right',
        allowedOrigins: dto.allowedOrigins || [],
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.odWidget.findMany({
      where: { tenantId },
      include: { channel: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const widget = await this.prisma.odWidget.findFirst({
      where: { id, tenantId },
      include: { channel: true },
    });
    if (!widget) throw new NotFoundException('Widget not found');
    return widget;
  }

  async findByEmbedToken(embedToken: string) {
    const widget = await this.prisma.odWidget.findUnique({
      where: { embedToken },
      include: { tenant: { select: { id: true, name: true, isActive: true } } },
    });
    if (!widget || !widget.isActive) throw new NotFoundException('Widget not found');
    return widget;
  }

  async update(tenantId: string, id: string, dto: UpdateWidgetDto) {
    await this.findById(tenantId, id);
    return this.prisma.odWidget.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.odWidget.delete({ where: { id } });
  }

  generateEmbedCode(widget: { embedToken: string }, baseUrl: string): string {
    return `<script src="${baseUrl}/widget/${widget.embedToken}/embed.js" async></script>`;
  }
}
