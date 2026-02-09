import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantMemberGuard } from '../tenant/guards/tenant-member.guard';
import { WidgetService } from './widget.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';

@Controller('api/omnidesk/tenants/:tenantId/widgets')
@UseGuards(JwtAuthGuard, TenantMemberGuard)
export class WidgetController {
  constructor(private widgetService: WidgetService) {}

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateWidgetDto) {
    return this.widgetService.create(tenantId, dto);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.widgetService.findAll(tenantId);
  }

  @Get(':id')
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.widgetService.findById(tenantId, id);
  }

  @Get(':id/embed-code')
  getEmbedCode(@Param('tenantId') tenantId: string, @Param('id') id: string, @Request() req: any) {
    return this.widgetService.findById(tenantId, id).then((widget) => ({
      embedCode: this.widgetService.generateEmbedCode(widget, `${req.protocol}://${req.get('host')}`),
    }));
  }

  @Patch(':id')
  update(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    return this.widgetService.update(tenantId, id, dto);
  }

  @Delete(':id')
  delete(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.widgetService.delete(tenantId, id);
  }
}
