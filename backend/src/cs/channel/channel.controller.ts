import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantMemberGuard } from '../tenant/guards/tenant-member.guard';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('api/omnidesk/tenants/:tenantId/channels')
@UseGuards(JwtAuthGuard, TenantMemberGuard)
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateChannelDto) {
    return this.channelService.create(tenantId, dto);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.channelService.findAll(tenantId);
  }

  @Get(':id')
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.channelService.findById(tenantId, id);
  }

  @Patch(':id')
  update(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channelService.update(tenantId, id, dto);
  }

  @Delete(':id')
  delete(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.channelService.delete(tenantId, id);
  }
}
