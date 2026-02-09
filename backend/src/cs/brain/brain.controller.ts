import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantMemberGuard } from '../tenant/guards/tenant-member.guard';
import { BrainService } from './brain.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { QueryPatternDto } from './dto/query-pattern.dto';

@Controller('api/omnidesk/tenants/:tenantId/brain')
@UseGuards(JwtAuthGuard, TenantMemberGuard)
export class BrainController {
  constructor(private brainService: BrainService) {}

  @Get('patterns')
  findAll(@Param('tenantId') tenantId: string, @Query() query: QueryPatternDto) {
    return this.brainService.findAll(tenantId, query);
  }

  @Get('patterns/:id')
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.brainService.findById(tenantId, id);
  }

  @Post('patterns')
  create(@Param('tenantId') tenantId: string, @Body() dto: CreatePatternDto) {
    return this.brainService.create(tenantId, dto);
  }

  @Patch('patterns/:id')
  update(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdatePatternDto) {
    return this.brainService.update(tenantId, id, dto);
  }

  @Delete('patterns/:id')
  delete(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.brainService.delete(tenantId, id);
  }

  @Get('insights')
  getInsights(@Param('tenantId') tenantId: string) {
    return this.brainService.getInsights(tenantId);
  }
}
