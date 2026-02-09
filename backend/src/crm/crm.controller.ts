import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmService } from './crm.service';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants/:tenantId')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Post('customers')
  @ApiOperation({ summary: '고객 등록' })
  create(@Param('tenantId') tenantId: string, @Body() dto: any) {
    return this.service.create(tenantId, dto);
  }

  @Get('customers')
  @ApiOperation({ summary: '고객 목록' })
  findAll(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.findAll(tenantId, query);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: '고객 상세' })
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: '고객 수정' })
  update(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete('customers/:id')
  @ApiOperation({ summary: '고객 삭제' })
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }

  @Get('customers/:id/history')
  @ApiOperation({ summary: '고객 이력 (예약+접촉+결제)' })
  getHistory(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.getHistory(tenantId, id);
  }

  @Post('customers/:customerId/contact-logs')
  @ApiOperation({ summary: '접촉 이력 추가' })
  createContactLog(@Param('tenantId') tenantId: string, @Param('customerId') customerId: string, @Body() dto: any) {
    return this.service.createContactLog(tenantId, customerId, dto);
  }

  @Get('customers/:customerId/contact-logs')
  @ApiOperation({ summary: '접촉 이력 조회' })
  findContactLogs(@Param('tenantId') tenantId: string, @Param('customerId') customerId: string) {
    return this.service.findContactLogs(tenantId, customerId);
  }
}
