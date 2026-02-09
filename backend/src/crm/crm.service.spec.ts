import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CrmService } from './crm.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CrmService', () => {
  let service: CrmService;
  const mockPrisma = {
    bpCustomer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bpContactLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    bpReservation: { findMany: jest.fn() },
    bpInvoice: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CrmService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('고객을 정상 생성해야 함', async () => {
      const dto = { name: '홍길동', phone: '010-1234-5678' };
      const result = { id: '1', tenantId: 't1', ...dto };
      mockPrisma.bpCustomer.create.mockResolvedValue(result);
      expect(await service.create('t1', dto)).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('페이지네이션으로 고객 목록 반환', async () => {
      mockPrisma.bpCustomer.findMany.mockResolvedValue([]);
      mockPrisma.bpCustomer.count.mockResolvedValue(0);
      const result = await service.findAll('t1', {});
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('검색어 필터가 적용되어야 함', async () => {
      mockPrisma.bpCustomer.findMany.mockResolvedValue([]);
      mockPrisma.bpCustomer.count.mockResolvedValue(0);
      await service.findAll('t1', { search: '홍길동' });
      expect(mockPrisma.bpCustomer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('고객 상세를 반환해야 함', async () => {
      const customer = { id: '1', name: '홍길동' };
      mockPrisma.bpCustomer.findFirst.mockResolvedValue(customer);
      expect(await service.findOne('t1', '1')).toEqual(customer);
    });

    it('없는 고객이면 NotFoundException', async () => {
      mockPrisma.bpCustomer.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    it('타임라인 데이터를 병합해서 반환해야 함', async () => {
      mockPrisma.bpReservation.findMany.mockResolvedValue([
        { id: 'r1', date: new Date('2026-01-01'), status: 'COMPLETED' },
      ]);
      mockPrisma.bpContactLog.findMany.mockResolvedValue([]);
      mockPrisma.bpInvoice.findMany.mockResolvedValue([]);
      const result = await service.getHistory('t1', 'c1');
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('type', 'RESERVATION');
    });
  });
});
