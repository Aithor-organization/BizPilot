import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetTokenGuard } from './guards/widget-token.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IsString, MaxLength, IsOptional } from 'class-validator';

class CreateVisitorConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitorName?: string;

  @IsOptional()
  @IsString()
  visitorEmail?: string;
}

class SendVisitorMessageDto {
  @IsString()
  @MaxLength(4000)
  content: string;
}

@Controller('api/omnidesk/widget/public')
export class WidgetPublicController {
  constructor(
    private widgetService: WidgetService,
    private prisma: PrismaService,
    @InjectQueue('message-processing') private messageQueue: Queue,
  ) {}

  @Get(':embedToken/config')
  @UseGuards(WidgetTokenGuard)
  getConfig(@Request() req: any) {
    const w = req.widget;
    return {
      name: w.name,
      primaryColor: w.primaryColor,
      greeting: w.greeting,
      position: w.position,
    };
  }

  @Post(':embedToken/conversations')
  @UseGuards(WidgetTokenGuard)
  async createConversation(
    @Request() req: any,
    @Body() dto: CreateVisitorConversationDto,
  ) {
    const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return this.prisma.odConversation.create({
      data: {
        tenantId: req.widget.tenantId,
        widgetId: req.widget.id,
        visitorId,
        visitorName: dto.visitorName,
        visitorEmail: dto.visitorEmail,
        status: 'OPEN',
      },
    });
  }

  @Post(':embedToken/conversations/:conversationId/messages')
  @UseGuards(WidgetTokenGuard)
  async sendMessage(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendVisitorMessageDto,
  ) {
    // Strip HTML tags
    const sanitized = dto.content.replace(/<[^>]*>/g, '');

    const message = await this.prisma.odMessage.create({
      data: {
        conversationId,
        senderType: 'VISITOR',
        content: sanitized,
      },
    });

    // Enqueue for processing
    await this.messageQueue.add('process-message', {
      messageId: message.id,
      conversationId,
      tenantId: req.widget.tenantId,
      content: sanitized,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    return message;
  }
}
