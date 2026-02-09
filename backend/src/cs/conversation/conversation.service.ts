import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryConversationDto } from './dto/query-conversation.dto';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryConversationDto) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedAgent) where.assignedAgent = query.assignedAgent;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [items, total] = await Promise.all([
      this.prisma.odConversation.findMany({
        where,
        include: {
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.odConversation.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const conversation = await this.prisma.odConversation.findFirst({
      where: { id, tenantId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        widget: { select: { id: true, name: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    await this.findById(tenantId, id);
    const data: any = { status };
    if (status === 'RESOLVED') data.resolvedAt = new Date();
    return this.prisma.odConversation.update({ where: { id }, data });
  }

  async assignAgent(tenantId: string, id: string, agentId: string) {
    await this.findById(tenantId, id);
    return this.prisma.odConversation.update({
      where: { id },
      data: { assignedAgent: agentId, status: 'ASSIGNED' },
    });
  }

  async sendAgentMessage(tenantId: string, conversationId: string, userId: string, content: string) {
    await this.findById(tenantId, conversationId);
    const sanitized = content.replace(/<[^>]*>/g, '').slice(0, 4000);
    return this.prisma.odMessage.create({
      data: {
        conversationId,
        senderType: 'AGENT',
        senderId: userId,
        content: sanitized,
      },
    });
  }
}
