import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Employees ───

  async createEmployee(tenantId: string, dto: {
    name: string; phone?: string; email?: string; role?: string;
    payType?: string; payRate?: number; startDate?: string; userId?: string;
  }) {
    return this.prisma.bpEmployee.create({
      data: {
        tenantId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        role: dto.role,
        payType: (dto.payType as any) || 'HOURLY',
        payRate: dto.payRate ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        userId: dto.userId,
      },
    });
  }

  async findAllEmployees(tenantId: string, includeInactive = false) {
    const where: Record<string, unknown> = { tenantId };
    if (!includeInactive) where.isActive = true;
    return this.prisma.bpEmployee.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOneEmployee(tenantId: string, id: string) {
    const employee = await this.prisma.bpEmployee.findFirst({
      where: { id, tenantId },
      include: {
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        leaves: { orderBy: { startDate: 'desc' }, take: 10 },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async updateEmployee(tenantId: string, id: string, dto: Partial<{
    name: string; phone: string; email: string; role: string;
    payType: string; payRate: number; endDate: string;
  }>) {
    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.payType) data.payType = dto.payType;
    if (dto.payRate !== undefined) data.payRate = dto.payRate;
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.bpEmployee.update({ where: { id }, data });
  }

  async deactivateEmployee(tenantId: string, id: string) {
    return this.prisma.bpEmployee.update({
      where: { id },
      data: { isActive: false, endDate: new Date() },
    });
  }

  // ─── Attendance ───

  async clockIn(tenantId: string, employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.bpAttendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing?.clockIn) {
      throw new BadRequestException('Already clocked in today');
    }

    return this.prisma.bpAttendance.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      create: {
        tenantId,
        employeeId,
        date: today,
        clockIn: new Date(),
        status: 'PRESENT',
      },
      update: {
        clockIn: new Date(),
        status: 'PRESENT',
      },
    });
  }

  async clockOut(tenantId: string, employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.bpAttendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance?.clockIn) {
      throw new BadRequestException('Must clock in first');
    }
    if (attendance.clockOut) {
      throw new BadRequestException('Already clocked out today');
    }

    const clockOut = new Date();
    const totalMinutes = Math.round(
      (clockOut.getTime() - attendance.clockIn.getTime()) / 60000,
    );

    return this.prisma.bpAttendance.update({
      where: { employeeId_date: { employeeId, date: today } },
      data: {
        clockOut,
        totalMinutes: totalMinutes - attendance.breakMinutes,
      },
    });
  }

  async findAllAttendance(tenantId: string, query: {
    startDate?: string; endDate?: string; employeeId?: string; page?: number; limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Record<string, unknown> = { tenantId };

    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.bpAttendance.findMany({
        where,
        include: { employee: { select: { id: true, name: true, role: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bpAttendance.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getAttendanceSummary(tenantId: string, query: {
    startDate?: string; endDate?: string; employeeId?: string;
  }) {
    const where: Record<string, unknown> = { tenantId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const attendances = await this.prisma.bpAttendance.findMany({
      where,
      include: { employee: { select: { id: true, name: true } } },
    });

    const byEmployee = new Map<string, {
      name: string; presentDays: number; absentDays: number;
      lateDays: number; totalMinutes: number;
    }>();

    for (const a of attendances) {
      const key = a.employeeId;
      const existing = byEmployee.get(key) || {
        name: a.employee.name, presentDays: 0, absentDays: 0, lateDays: 0, totalMinutes: 0,
      };

      if (a.status === 'PRESENT') existing.presentDays++;
      else if (a.status === 'ABSENT') existing.absentDays++;
      else if (a.status === 'LATE') existing.lateDays++;

      existing.totalMinutes += a.totalMinutes;
      byEmployee.set(key, existing);
    }

    return Array.from(byEmployee.entries()).map(([employeeId, data]) => ({
      employeeId,
      ...data,
      totalHours: Math.round(data.totalMinutes / 60 * 10) / 10,
    }));
  }

  // ─── Leaves ───

  async createLeave(tenantId: string, dto: {
    employeeId: string; type: string; startDate: string; endDate: string;
    days?: number; reason?: string;
  }) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const days = dto.days ?? Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    return this.prisma.bpLeave.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        type: dto.type as any,
        startDate,
        endDate,
        days,
        reason: dto.reason,
      },
      include: { employee: { select: { id: true, name: true } } },
    });
  }

  async findAllLeaves(tenantId: string, query: {
    status?: string; employeeId?: string; page?: number; limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, unknown> = { tenantId };
    if (query.status) where.status = query.status;
    if (query.employeeId) where.employeeId = query.employeeId;

    const [data, total] = await Promise.all([
      this.prisma.bpLeave.findMany({
        where,
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bpLeave.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async approveLeave(tenantId: string, id: string, status: string, approvedBy?: string) {
    return this.prisma.bpLeave.update({
      where: { id },
      data: {
        status: status as any,
        approvedBy,
      },
      include: { employee: { select: { id: true, name: true } } },
    });
  }
}
