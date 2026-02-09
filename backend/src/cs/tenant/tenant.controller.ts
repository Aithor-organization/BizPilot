import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantMemberGuard } from './guards/tenant-member.guard';
import { TenantOwnerGuard } from './guards/tenant-owner.guard';
import { CurrentTenant } from './decorators/current-tenant.decorator';

@Controller('api/omnidesk/tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateTenantDto) {
    return this.tenantService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.tenantService.findAllForUser(req.user.id);
  }

  @Get(':tenantId')
  @UseGuards(TenantMemberGuard)
  findOne(@Param('tenantId') tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  @Patch(':tenantId')
  @UseGuards(TenantMemberGuard, TenantOwnerGuard)
  update(@Param('tenantId') tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(tenantId, dto);
  }

  @Delete(':tenantId')
  @UseGuards(TenantMemberGuard, TenantOwnerGuard)
  delete(@Param('tenantId') tenantId: string) {
    return this.tenantService.delete(tenantId);
  }

  @Get(':tenantId/members')
  @UseGuards(TenantMemberGuard)
  getMembers(@Param('tenantId') tenantId: string) {
    return this.tenantService.getMembers(tenantId);
  }

  @Post(':tenantId/members')
  @UseGuards(TenantMemberGuard, TenantOwnerGuard)
  addMember(
    @Param('tenantId') tenantId: string,
    @Body() body: { userId: string; role?: string },
  ) {
    return this.tenantService.addMember(tenantId, body.userId, body.role);
  }

  @Delete(':tenantId/members/:userId')
  @UseGuards(TenantMemberGuard, TenantOwnerGuard)
  removeMember(@Param('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.tenantService.removeMember(tenantId, userId);
  }
}
