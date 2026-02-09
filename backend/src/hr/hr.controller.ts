import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HrService } from './hr.service';

@ApiTags('HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tenants/:tenantId')
export class HrController {
  constructor(private readonly service: HrService) {}

  // ─── Employees ───

  @Post('employees')
  @ApiOperation({ summary: '직원 등록' })
  createEmployee(@Param('tenantId') tenantId: string, @Body() dto: any) {
    return this.service.createEmployee(tenantId, dto);
  }

  @Get('employees')
  @ApiOperation({ summary: '직원 목록' })
  findAllEmployees(
    @Param('tenantId') tenantId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.service.findAllEmployees(tenantId, includeInactive === 'true');
  }

  @Get('employees/:id')
  @ApiOperation({ summary: '직원 상세' })
  findOneEmployee(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.findOneEmployee(tenantId, id);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: '직원 수정' })
  updateEmployee(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateEmployee(tenantId, id, dto);
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: '직원 비활성화' })
  deactivateEmployee(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.deactivateEmployee(tenantId, id);
  }

  // ─── Attendance ───

  @Post('employees/:employeeId/clock-in')
  @ApiOperation({ summary: '출근 체크' })
  clockIn(@Param('tenantId') tenantId: string, @Param('employeeId') employeeId: string) {
    return this.service.clockIn(tenantId, employeeId);
  }

  @Post('employees/:employeeId/clock-out')
  @ApiOperation({ summary: '퇴근 체크' })
  clockOut(@Param('tenantId') tenantId: string, @Param('employeeId') employeeId: string) {
    return this.service.clockOut(tenantId, employeeId);
  }

  @Get('attendance')
  @ApiOperation({ summary: '근태 목록' })
  findAllAttendance(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.findAllAttendance(tenantId, query);
  }

  @Get('attendance/summary')
  @ApiOperation({ summary: '근태 요약' })
  getAttendanceSummary(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.getAttendanceSummary(tenantId, query);
  }

  // ─── Leaves ───

  @Post('leaves')
  @ApiOperation({ summary: '휴가 신청' })
  createLeave(@Param('tenantId') tenantId: string, @Body() dto: any) {
    return this.service.createLeave(tenantId, dto);
  }

  @Get('leaves')
  @ApiOperation({ summary: '휴가 목록' })
  findAllLeaves(@Param('tenantId') tenantId: string, @Query() query: any) {
    return this.service.findAllLeaves(tenantId, query);
  }

  @Patch('leaves/:id/approve')
  @ApiOperation({ summary: '휴가 승인/반려' })
  approveLeave(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.approveLeave(tenantId, id, status);
  }
}
