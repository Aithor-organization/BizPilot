import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  // === Services ===
  async createService(tenantId: string, dto: CreateServiceDto) {
    return this.prisma.bpService.create({
      data: { tenantId, ...dto },
    });
  }

  async findAllServices(tenantId: string) {
    return this.prisma.bpService.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateService(tenantId: string, id: string, dto: Partial<CreateServiceDto>) {
    return this.prisma.bpService.update({
      where: { id },
      data: dto,
    });
  }

  async removeService(tenantId: string, id: string) {
    return this.prisma.bpService.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // === Slots ===
  async findAllSlots(tenantId: string) {
    return this.prisma.bpReservationSlot.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async upsertSlots(tenantId: string, slots: Array<{
    dayOfWeek: number; startTime: string; endTime: string;
    slotMinutes?: number; maxBookings?: number; isActive?: boolean;
  }>) {
    const results = [];
    for (const slot of slots) {
      const result = await this.prisma.bpReservationSlot.upsert({
        where: { tenantId_dayOfWeek: { tenantId, dayOfWeek: slot.dayOfWeek } },
        create: {
          tenantId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotMinutes: slot.slotMinutes ?? 30,
          maxBookings: slot.maxBookings ?? 1,
          isActive: slot.isActive ?? true,
        },
        update: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotMinutes: slot.slotMinutes,
          maxBookings: slot.maxBookings,
          isActive: slot.isActive,
        },
      });
      results.push(result);
    }
    return results;
  }

  // === Reservations ===
  async create(tenantId: string, dto: CreateReservationDto) {
    return this.prisma.bpReservation.create({
      data: {
        tenantId,
        customerId: dto.customerId || null,
        serviceId: dto.serviceId || null,
        employeeId: dto.employeeId || null,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        note: dto.note,
        source: dto.source ?? 'MANUAL',
      },
      include: { customer: true, service: true, employee: true },
    });
  }

  async findAll(tenantId: string, query: QueryReservationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = { tenantId };
    if (query.date) {
      const d = new Date(query.date);
      where.date = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    }
    if (query.startDate && query.endDate) {
      where.date = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.bpReservation.findMany({
        where,
        include: { customer: true, service: true, employee: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bpReservation.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string) {
    const reservation = await this.prisma.bpReservation.findFirst({
      where: { id, tenantId },
      include: { customer: true, service: true, employee: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateReservationDto>) {
    const data: Record<string, unknown> = {};
    if (dto.date) data.date = new Date(dto.date);
    if (dto.startTime) data.startTime = dto.startTime;
    if (dto.endTime) data.endTime = dto.endTime;
    if (dto.customerId !== undefined) data.customerId = dto.customerId || null;
    if (dto.serviceId !== undefined) data.serviceId = dto.serviceId || null;
    if (dto.employeeId !== undefined) data.employeeId = dto.employeeId || null;
    if (dto.note !== undefined) data.note = dto.note;

    return this.prisma.bpReservation.update({
      where: { id },
      data,
      include: { customer: true, service: true, employee: true },
    });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    return this.prisma.bpReservation.update({
      where: { id },
      data: { status: status as any },
      include: { customer: true, service: true, employee: true },
    });
  }

  async findAvailable(tenantId: string, date: string) {
    const dayOfWeek = new Date(date).getDay();
    const slot = await this.prisma.bpReservationSlot.findUnique({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
    });

    if (!slot || !slot.isActive) return [];

    const d = new Date(date);
    const existing = await this.prisma.bpReservation.findMany({
      where: {
        tenantId,
        date: {
          gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
        },
        status: { notIn: ['CANCELLED'] },
      },
    });

    const times: string[] = [];
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m < endMinutes; m += slot.slotMinutes) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      const booked = existing.filter((r) => r.startTime <= timeStr && r.endTime > timeStr);
      if (booked.length < slot.maxBookings) {
        times.push(timeStr);
      }
    }

    return times;
  }
}
