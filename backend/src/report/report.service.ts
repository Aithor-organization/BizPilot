import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(tenantId: string, dto: {
    type: string; category: string; description: string; amount: number;
    date?: string; referenceId?: string; referenceType?: string;
  }, userId?: string) {
    return this.prisma.bpTransaction.create({
      data: {
        tenantId,
        type: dto.type as any,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : new Date(),
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        createdBy: userId,
      },
    });
  }

  async findAllTransactions(tenantId: string, query: {
    startDate?: string; endDate?: string; type?: string; category?: string; page?: number; limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, unknown> = { tenantId };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;

    const [data, total] = await Promise.all([
      this.prisma.bpTransaction.findMany({
        where, orderBy: { date: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.bpTransaction.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async removeTransaction(tenantId: string, id: string) {
    return this.prisma.bpTransaction.delete({ where: { id } });
  }

  async getSummary(tenantId: string, query: { startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const transactions = await this.prisma.bpTransaction.findMany({ where });
    const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Math.abs(t.amount), 0);

    return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense, transactionCount: transactions.length };
  }

  async getByCategory(tenantId: string, query: { startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const transactions = await this.prisma.bpTransaction.findMany({ where });
    const grouped = new Map<string, { type: string; amount: number }>();

    for (const t of transactions) {
      const key = `${t.category}_${t.type}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        grouped.set(key, { type: t.type, amount: t.amount });
      }
    }

    return Array.from(grouped.entries()).map(([key, val]) => ({
      category: key.split('_')[0],
      type: val.type,
      amount: val.amount,
    })).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }

  async getTrend(tenantId: string, months = 6) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const transactions = await this.prisma.bpTransaction.findMany({
      where: { tenantId, date: { gte: startDate } },
    });

    const trend: Record<string, { income: number; expense: number }> = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trend[key] = { income: 0, expense: 0 };
    }

    for (const t of transactions) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (trend[key]) {
        if (t.type === 'INCOME') trend[key].income += t.amount;
        else trend[key].expense += t.amount;
      }
    }

    return Object.entries(trend).map(([month, data]) => ({ month, ...data }));
  }

  async getDashboard(tenantId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayReservations, totalCustomers, monthlyTransactions, recentTransactions, recentReservations] = await Promise.all([
      this.prisma.bpReservation.count({
        where: { tenantId, date: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.bpCustomer.count({ where: { tenantId } }),
      this.prisma.bpTransaction.findMany({
        where: { tenantId, date: { gte: monthStart }, type: 'INCOME' },
      }),
      this.prisma.bpTransaction.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      this.prisma.bpReservation.findMany({
        where: { tenantId, date: { gte: today, lt: tomorrow } },
        include: { customer: true, service: true },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
    ]);

    const monthlyRevenue = monthlyTransactions.reduce((s, t) => s + t.amount, 0);

    return {
      todayReservations,
      monthlyRevenue,
      totalCustomers,
      aiResponseRate: 0,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id, description: t.description, category: t.category, amount: t.amount,
      })),
      recentReservations: recentReservations.map((r) => ({
        id: r.id, customerName: r.customer?.name, serviceName: r.service?.name,
        startTime: r.startTime, status: r.status,
      })),
    };
  }
}
