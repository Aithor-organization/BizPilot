import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantMemberGuard } from '../tenant/guards/tenant-member.guard';
import { ConversationService } from './conversation.service';
import { QueryConversationDto } from './dto/query-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('api/omnidesk/tenants/:tenantId/conversations')
@UseGuards(JwtAuthGuard, TenantMemberGuard)
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Query() query: QueryConversationDto) {
    return this.conversationService.findAll(tenantId, query);
  }

  @Get(':id')
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.conversationService.findById(tenantId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.conversationService.updateStatus(tenantId, id, status);
  }

  @Patch(':id/assign')
  assignAgent(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('agentId') agentId: string,
  ) {
    return this.conversationService.assignAgent(tenantId, id, agentId);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ) {
    return this.conversationService.sendAgentMessage(tenantId, id, req.user.id, dto.content);
  }
}
