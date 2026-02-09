import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationService } from './reservation.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';

@ApiTags('Reservation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants/:tenantId')
export class ReservationController {
  constructor(private readonly service: ReservationService) {}

  // Services
  @Post('services')
  @ApiOperation({ summary: '서비스 생성' })
  createService(@Param('tenantId') tenantId: string, @Body() dto: CreateServiceDto) {
    return this.service.createService(tenantId, dto);
  }

  @Get('services')
  @ApiOperation({ summary: '서비스 목록' })
  findAllServices(@Param('tenantId') tenantId: string) {
    return this.service.findAllServices(tenantId);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: '서비스 수정' })
  updateService(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateServiceDto>) {
    return this.service.updateService(tenantId, id, dto);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: '서비스 삭제' })
  removeService(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.removeService(tenantId, id);
  }

  // Slots
  @Get('reservation-slots')
  @ApiOperation({ summary: '예약 슬롯 조회' })
  findAllSlots(@Param('tenantId') tenantId: string) {
    return this.service.findAllSlots(tenantId);
  }

  @Put('reservation-slots')
  @ApiOperation({ summary: '예약 슬롯 설정' })
  upsertSlots(@Param('tenantId') tenantId: string, @Body('slots') slots: any[]) {
    return this.service.upsertSlots(tenantId, slots);
  }

  // Reservations
  @Post('reservations')
  @ApiOperation({ summary: '예약 생성' })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateReservationDto) {
    return this.service.create(tenantId, dto);
  }

  @Get('reservations')
  @ApiOperation({ summary: '예약 목록' })
  findAll(@Param('tenantId') tenantId: string, @Query() query: QueryReservationDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get('reservations/available')
  @ApiOperation({ summary: '예약 가능 시간 조회' })
  findAvailable(@Param('tenantId') tenantId: string, @Query('date') date: string) {
    return this.service.findAvailable(tenantId, date);
  }

  @Get('reservations/:id')
  @ApiOperation({ summary: '예약 상세' })
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Patch('reservations/:id')
  @ApiOperation({ summary: '예약 수정' })
  update(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateReservationDto>) {
    return this.service.update(tenantId, id, dto);
  }

  @Patch('reservations/:id/status')
  @ApiOperation({ summary: '예약 상태 변경' })
  updateStatus(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.service.updateStatus(tenantId, id, status);
  }
}
