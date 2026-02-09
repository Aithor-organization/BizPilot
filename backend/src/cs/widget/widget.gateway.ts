import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/omnidesk/chat',
  cors: { origin: '*', credentials: true },
})
export class WidgetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WidgetGateway.name);

  constructor(
    private widgetService: WidgetService,
    private prisma: PrismaService,
    @InjectQueue('message-processing') private messageQueue: Queue,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const embedToken = client.handshake.query.embedToken as string;
      if (!embedToken) {
        client.disconnect();
        return;
      }

      const widget = await this.widgetService.findByEmbedToken(embedToken);
      if (!widget) {
        client.disconnect();
        return;
      }

      client.data.tenantId = widget.tenantId;
      client.data.widgetId = widget.id;
      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    client.data.conversationId = data.conversationId;
    return { event: 'joined', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string; conversationId: string },
  ) {
    const sanitized = data.content.replace(/<[^>]*>/g, '').slice(0, 4000);

    const message = await this.prisma.odMessage.create({
      data: {
        conversationId: data.conversationId,
        senderType: 'VISITOR',
        content: sanitized,
      },
    });

    // Broadcast to room
    this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);

    // Enqueue for processing
    await this.messageQueue.add('process-message', {
      messageId: message.id,
      conversationId: data.conversationId,
      tenantId: client.data.tenantId,
      content: sanitized,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    return { event: 'message_sent', data: message };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('typing', {
      isTyping: data.isTyping,
      senderType: 'VISITOR',
    });
  }

  // Called from message processor to send bot response
  emitBotResponse(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('new_message', message);
  }

  emitAgentJoined(conversationId: string, agentName: string) {
    this.server.to(`conversation:${conversationId}`).emit('agent_joined', { agentName });
  }
}
