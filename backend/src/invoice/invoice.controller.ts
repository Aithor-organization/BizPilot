import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoiceService } from './invoice.service';

@ApiTags('Invoice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants/:tenantId/invoices')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: '견적서 생성' })
  create(@Param('tenantId') tenantId: string, @Body() dto: any) {
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: '견적서 목록' })
  findAll(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '견적서 상세' })
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '견적서 수정' })
  update(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '견적서 삭제' })
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '견적서 상태 변경' })
  updateStatus(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.service.updateStatus(tenantId, id, status);
  }
}
