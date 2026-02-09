import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportService', () => {
  let service: ReportService;
  const mockPrisma = {
    bpTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bpReservation: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    bpCustomer: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ReportService);
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('수입/지출 요약을 계산해야 함', async () => {
      mockPrisma.bpTransaction.findMany.mockResolvedValue([
        { type: 'INCOME', amount: 50000 },
        { type: 'INCOME', amount: 30000 },
        { type: 'EXPENSE', amount: -10000 },
      ]);
      const result = await service.getSummary('t1', {});
      expect(result.totalIncome).toBe(80000);
      expect(result.totalExpense).toBe(10000);
      expect(result.netProfit).toBe(70000);
      expect(result.transactionCount).toBe(3);
    });

    it('거래가 없으면 모두 0', async () => {
      mockPrisma.bpTransaction.findMany.mockResolvedValue([]);
      const result = await service.getSummary('t1', {});
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.netProfit).toBe(0);
    });
  });

  describe('getByCategory', () => {
    it('카테고리별로 금액을 그룹핑해야 함', async () => {
      mockPrisma.bpTransaction.findMany.mockResolvedValue([
        { category: '서비스', type: 'INCOME', amount: 30000 },
        { category: '서비스', type: 'INCOME', amount: 20000 },
        { category: '재료비', type: 'EXPENSE', amount: 5000 },
      ]);
      const result = await service.getByCategory('t1', {});
      expect(result).toHaveLength(2);
      const serviceCategory = result.find((r) => r.category === '서비스');
      expect(serviceCategory?.amount).toBe(50000);
    });
  });

  describe('getTrend', () => {
    it('월별 추세를 반환해야 함', async () => {
      mockPrisma.bpTransaction.findMany.mockResolvedValue([]);
      const result = await service.getTrend('t1', 3);
      expect(result).toHaveLength(3);
      result.forEach((item) => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('income');
        expect(item).toHaveProperty('expense');
      });
    });
  });

  describe('createTransaction', () => {
    it('거래를 정상 생성해야 함', async () => {
      const dto = { type: 'INCOME', category: '서비스', description: '커트', amount: 15000 };
      const result = { id: '1', tenantId: 't1', ...dto };
      mockPrisma.bpTransaction.create.mockResolvedValue(result);
      expect(await service.createTransaction('t1', dto)).toEqual(result);
    });
  });
});
