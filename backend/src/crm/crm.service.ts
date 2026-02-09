import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: { name: string; phone?: string; email?: string; birthDate?: string; gender?: string; tags?: string[]; note?: string }) {
    return this.prisma.bpCustomer.create({
      data: {
        tenantId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        gender: dto.gender,
        tags: dto.tags ?? [],
        note: dto.note,
      },
    });
  }

  async findAll(tenantId: string, query: { search?: string; tags?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, unknown> = { tenantId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }
    if (query.tags) {
      where.tags = { hasSome: query.tags.split(',') };
    }

    const [data, total] = await Promise.all([
      this.prisma.bpCustomer.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bpCustomer.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.bpCustomer.findFirst({
      where: { id, tenantId },
      include: { reservations: { take: 5, orderBy: { date: 'desc' } }, invoices: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(tenantId: string, id: string, dto: Partial<{ name: string; phone: string; email: string; tags: string[]; note: string }>) {
    return this.prisma.bpCustomer.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.bpCustomer.delete({ where: { id } });
  }

  async getHistory(tenantId: string, customerId: string) {
    const [reservations, contactLogs, invoices] = await Promise.all([
      this.prisma.bpReservation.findMany({
        where: { customerId, tenantId },
        include: { service: true },
        orderBy: { date: 'desc' },
        take: 20,
      }),
      this.prisma.bpContactLog.findMany({
        where: { customerId, tenantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.bpInvoice.findMany({
        where: { customerId, tenantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const timeline = [
      ...reservations.map((r) => ({
        type: 'RESERVATION', date: r.date, description: `예약: ${r.service?.name || '서비스'} (${r.startTime}~${r.endTime})`, status: r.status,
      })),
      ...contactLogs.map((c) => ({
        type: 'CONTACT', date: c.createdAt, description: `${c.type}: ${c.content}`,
      })),
      ...invoices.map((i) => ({
        type: 'INVOICE', date: i.createdAt, description: `${i.invoiceNumber} (${i.type})`, amount: i.totalAmount,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  async createContactLog(tenantId: string, customerId: string, dto: { type: string; content: string }, userId?: string) {
    return this.prisma.bpContactLog.create({
      data: { tenantId, customerId, type: dto.type as any, content: dto.content, createdBy: userId },
    });
  }

  async findContactLogs(tenantId: string, customerId: string) {
    return this.prisma.bpContactLog.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
