import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessProfileService } from './business-profile.service';
import { UpsertBusinessProfileDto } from './dto/upsert-business-profile.dto';

@ApiTags('BusinessProfile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants/:tenantId/business-profile')
export class BusinessProfileController {
  constructor(private readonly service: BusinessProfileService) {}

  @Get()
  @ApiOperation({ summary: '업종 프로필 조회' })
  findOne(@Param('tenantId') tenantId: string) {
    return this.service.findOne(tenantId);
  }

  @Put()
  @ApiOperation({ summary: '업종 프로필 설정/수정' })
  upsert(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpsertBusinessProfileDto,
  ) {
    return this.service.upsert(tenantId, dto);
  }
}
