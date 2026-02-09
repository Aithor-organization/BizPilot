import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  async getBalance(tenantId: string) {
    const account = await this.prisma.odCreditAccount.findUnique({ where: { tenantId } });
    if (!account) throw new NotFoundException('Credit account not found');
    return account;
  }

  async getTransactions(tenantId: string, page: number = 1, limit: number = 20) {
    const account = await this.getBalance(tenantId);
    const [items, total] = await Promise.all([
      this.prisma.odCreditTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.odCreditTransaction.count({ where: { accountId: account.id } }),
    ]);
    return { items, total, page, limit, balance: account.balance };
  }

  async deductCredits(
    tenantId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.odCreditAccount.findUnique({ where: { tenantId } });
      if (!account) throw new NotFoundException('Credit account not found');
      if (account.balance < amount) {
        throw new BadRequestException('Insufficient credits');
      }

      const newBalance = account.balance - amount;
      await tx.odCreditAccount.update({
        where: { tenantId },
        data: { balance: newBalance },
      });

      await tx.odCreditTransaction.create({
        data: {
          accountId: account.id,
          type: 'DEDUCT',
          amount: -amount,
          balanceAfter: newBalance,
          description,
          referenceId,
          referenceType,
        },
      });

      return { balance: newBalance };
    });
  }

  async addCredits(
    tenantId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.odCreditAccount.findUnique({ where: { tenantId } });
      if (!account) throw new NotFoundException('Credit account not found');

      const newBalance = account.balance + amount;
      await tx.odCreditAccount.update({
        where: { tenantId },
        data: { balance: newBalance },
      });

      await tx.odCreditTransaction.create({
        data: {
          accountId: account.id,
          type: 'CHARGE',
          amount,
          balanceAfter: newBalance,
          description,
          referenceId,
          referenceType,
        },
      });

      return { balance: newBalance };
    });
  }

  async refundCredits(tenantId: string, amount: number, originalTransactionId: string) {
    return this.addCredits(tenantId, amount, '크레딧 환불', originalTransactionId, 'REFUND');
  }
}
