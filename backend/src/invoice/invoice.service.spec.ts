import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  const mockPrisma = {
    bpInvoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(InvoiceService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('견적서를 정상 생성해야 함', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      const result = { id: '1', invoiceNumber: 'EST-20260209-001', totalAmount: 15000 };
      mockPrisma.bpInvoice.create.mockResolvedValue(result);

      const dto = { items: [{ description: '커트', unitPrice: 15000 }] };
      expect(await service.create('t1', dto)).toEqual(result);
    });

    it('세금계산서면 세액 10% 적용', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      mockPrisma.bpInvoice.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.create('t1', {
        type: 'TAX_INVOICE',
        items: [{ description: '커트', unitPrice: 10000, quantity: 1 }],
      });

      expect(mockPrisma.bpInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taxAmount: 1000,
            totalAmount: 11000,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('페이지네이션으로 견적서 목록 반환', async () => {
      mockPrisma.bpInvoice.findMany.mockResolvedValue([]);
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      const result = await service.findAll('t1', {});
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('견적서 상세를 반환해야 함', async () => {
      const invoice = { id: '1', invoiceNumber: 'EST-20260209-001' };
      mockPrisma.bpInvoice.findFirst.mockResolvedValue(invoice);
      expect(await service.findOne('t1', '1')).toEqual(invoice);
    });

    it('없으면 NotFoundException', async () => {
      mockPrisma.bpInvoice.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('상태를 정상 변경해야 함', async () => {
      const result = { id: '1', status: 'SENT' };
      mockPrisma.bpInvoice.update.mockResolvedValue(result);
      expect(await service.updateStatus('t1', '1', 'SENT')).toEqual(result);
    });
  });

  // ─── 비즈니스 크리티컬 Edge Cases ───

  describe('세금 계산 정확성', () => {
    it('다중 항목 세금계산서: 각 항목 합산 후 10% 세액', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      mockPrisma.bpInvoice.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.create('t1', {
        type: 'TAX_INVOICE',
        items: [
          { description: '커트', unitPrice: 15000, quantity: 1 },
          { description: '염색', unitPrice: 35000, quantity: 1 },
          { description: '트리트먼트', unitPrice: 20000, quantity: 2 },
        ],
      });

      // subtotal = 15000 + 35000 + 40000 = 90000
      // taxAmount = Math.round(90000 * 0.1) = 9000
      // totalAmount = 99000
      expect(mockPrisma.bpInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 90000,
            taxAmount: 9000,
            totalAmount: 99000,
          }),
        }),
      );
    });

    it('견적서(ESTIMATE)는 세액이 0이어야 함', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      mockPrisma.bpInvoice.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.create('t1', {
        type: 'ESTIMATE',
        items: [{ description: '커트', unitPrice: 50000, quantity: 1 }],
      });

      expect(mockPrisma.bpInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taxAmount: 0,
            subtotal: 50000,
            totalAmount: 50000,
          }),
        }),
      );
    });

    it('소수점 발생 시 반올림 처리 (1원 단위)', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      mockPrisma.bpInvoice.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.create('t1', {
        type: 'TAX_INVOICE',
        items: [{ description: '서비스', unitPrice: 33333, quantity: 1 }],
      });

      // subtotal = 33333, taxAmount = Math.round(33333 * 0.1) = Math.round(3333.3) = 3333
      expect(mockPrisma.bpInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 33333,
            taxAmount: 3333,
            totalAmount: 36666,
          }),
        }),
      );
    });

    it('수량이 미지정이면 기본값 1 적용', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      mockPrisma.bpInvoice.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.create('t1', {
        items: [{ description: '커트', unitPrice: 15000 }],
      });

      expect(mockPrisma.bpInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 15000,
            totalAmount: 15000,
          }),
        }),
      );
    });
  });

  describe('인보이스 번호 생성', () => {
    it('같은 날 여러 견적서 생성 시 순번 증가', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(5);
      mockPrisma.bpInvoice.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.create('t1', {
        items: [{ description: '커트', unitPrice: 10000 }],
      });

      expect(mockPrisma.bpInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceNumber: expect.stringMatching(/^EST-\d{8}-006$/),
          }),
        }),
      );
    });

    it('세금계산서는 TAX 접두사를 사용해야 함', async () => {
      mockPrisma.bpInvoice.count.mockResolvedValue(0);
      mockPrisma.bpInvoice.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.create('t1', {
        type: 'TAX_INVOICE',
        items: [{ description: '서비스', unitPrice: 10000 }],
      });

      expect(mockPrisma.bpInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceNumber: expect.stringMatching(/^TAX-\d{8}-001$/),
          }),
        }),
      );
    });
  });
});
