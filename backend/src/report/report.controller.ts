import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';

@ApiTags('Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants/:tenantId')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Post('transactions')
  @ApiOperation({ summary: '거래 등록' })
  createTransaction(@Param('tenantId') tenantId: string, @Body() dto: any) {
    return this.service.createTransaction(tenantId, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: '거래 목록' })
  findAllTransactions(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.findAllTransactions(tenantId, query);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: '거래 삭제' })
  removeTransaction(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.removeTransaction(tenantId, id);
  }

  @Get('reports/summary')
  @ApiOperation({ summary: '기간별 요약' })
  getSummary(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.getSummary(tenantId, query);
  }

  @Get('reports/category')
  @ApiOperation({ summary: '카테고리별 분석' })
  getByCategory(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.getByCategory(tenantId, query);
  }

  @Get('reports/trend')
  @ApiOperation({ summary: '월별 추세' })
  getTrend(@Param('tenantId') tenantId: string, @Query('months') months?: number) {
    return this.service.getTrend(tenantId, months ?? 6);
  }

  @Get('reports/dashboard')
  @ApiOperation({ summary: '대시보드 종합 데이터' })
  getDashboard(@Param('tenantId') tenantId: string) {
    return this.service.getDashboard(tenantId);
  }
}
