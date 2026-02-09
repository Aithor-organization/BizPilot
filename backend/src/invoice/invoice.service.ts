import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(tenantId: string, type: string): Promise<string> {
    const prefix = type === 'ESTIMATE' ? 'EST' : type === 'TAX_INVOICE' ? 'TAX' : 'RCT';
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const count = await this.prisma.bpInvoice.count({
      where: {
        tenantId,
        invoiceNumber: { startsWith: `${prefix}-${dateStr}` },
      },
    });

    return `${prefix}-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(tenantId: string, dto: {
    type?: string; customerId?: string; dueDate?: string; note?: string;
    items: Array<{ description: string; quantity?: number; unitPrice: number; serviceId?: string }>;
  }) {
    const type = dto.type || 'ESTIMATE';
    const invoiceNumber = await this.generateInvoiceNumber(tenantId, type);

    const items = dto.items.map((item, i) => ({
      description: item.description,
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice,
      amount: (item.quantity ?? 1) * item.unitPrice,
      serviceId: item.serviceId || null,
      sortOrder: i,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = type === 'TAX_INVOICE' ? Math.round(subtotal * 0.1) : 0;
    const totalAmount = subtotal + taxAmount;

    return this.prisma.bpInvoice.create({
      data: {
        tenantId,
        invoiceNumber,
        type: type as any,
        customerId: dto.customerId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        note: dto.note,
        subtotal,
        taxAmount,
        totalAmount,
        items: { create: items },
      },
      include: { items: true, customer: true },
    });
  }

  async findAll(tenantId: string, query: { type?: string; status?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, unknown> = { tenantId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.bpInvoice.findMany({
        where, include: { items: true, customer: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.bpInvoice.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.bpInvoice.findFirst({
      where: { id, tenantId },
      include: { items: { orderBy: { sortOrder: 'asc' } }, customer: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(tenantId: string, id: string, dto: Partial<{ customerId: string; dueDate: string; note: string }>) {
    const data: Record<string, unknown> = {};
    if (dto.customerId !== undefined) data.customerId = dto.customerId || null;
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.note !== undefined) data.note = dto.note;
    return this.prisma.bpInvoice.update({ where: { id }, data, include: { items: true, customer: true } });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.bpInvoice.delete({ where: { id } });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    return this.prisma.bpInvoice.update({
      where: { id },
      data: { status: status as any },
      include: { items: true, customer: true },
    });
  }
}
