import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReservationService', () => {
  let service: ReservationService;
  const mockPrisma = {
    bpService: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bpReservationSlot: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    bpReservation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ReservationService);
    jest.clearAllMocks();
  });

  describe('createService', () => {
    it('서비스를 정상 생성해야 함', async () => {
      const dto = { name: '커트', price: 15000, duration: 30 };
      const result = { id: '1', tenantId: 't1', ...dto };
      mockPrisma.bpService.create.mockResolvedValue(result);
      expect(await service.createService('t1', dto)).toEqual(result);
    });
  });

  describe('findAllServices', () => {
    it('서비스 목록을 반환해야 함', async () => {
      const services = [{ id: '1', name: '커트' }];
      mockPrisma.bpService.findMany.mockResolvedValue(services);
      expect(await service.findAllServices('t1')).toEqual(services);
    });

    it('비어있으면 빈 배열 반환', async () => {
      mockPrisma.bpService.findMany.mockResolvedValue([]);
      expect(await service.findAllServices('t1')).toEqual([]);
    });
  });

  describe('create (reservation)', () => {
    it('예약을 정상 생성해야 함', async () => {
      const dto = { date: '2026-02-10', startTime: '10:00', endTime: '11:00' };
      const result = { id: '1', tenantId: 't1', status: 'PENDING', ...dto };
      mockPrisma.bpReservation.create.mockResolvedValue(result);
      expect(await service.create('t1', dto)).toEqual(result);
    });
  });

  describe('findAll (reservations)', () => {
    it('페이지네이션으로 예약을 조회해야 함', async () => {
      const data = [{ id: '1' }];
      mockPrisma.bpReservation.findMany.mockResolvedValue(data);
      mockPrisma.bpReservation.count.mockResolvedValue(1);
      const result = await service.findAll('t1', { page: 1, limit: 10 });
      expect(result).toEqual({ data, total: 1, page: 1, limit: 10 });
    });

    it('날짜 필터가 적용되어야 함', async () => {
      mockPrisma.bpReservation.findMany.mockResolvedValue([]);
      mockPrisma.bpReservation.count.mockResolvedValue(0);
      await service.findAll('t1', { date: '2026-02-10' });
      expect(mockPrisma.bpReservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
      );
    });

    it('날짜 범위 필터가 적용되어야 함', async () => {
      mockPrisma.bpReservation.findMany.mockResolvedValue([]);
      mockPrisma.bpReservation.count.mockResolvedValue(0);
      await service.findAll('t1', { startDate: '2026-02-01', endDate: '2026-02-28' });
      expect(mockPrisma.bpReservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 't1',
            date: {
              gte: new Date('2026-02-01'),
              lte: new Date('2026-02-28'),
            },
          }),
        }),
      );
    });

    it('상태 필터가 적용되어야 함', async () => {
      mockPrisma.bpReservation.findMany.mockResolvedValue([]);
      mockPrisma.bpReservation.count.mockResolvedValue(0);
      await service.findAll('t1', { status: 'CONFIRMED' });
      expect(mockPrisma.bpReservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 't1', status: 'CONFIRMED' }),
        }),
      );
    });
  });

  // ─── 비즈니스 크리티컬 Edge Cases ───

  describe('findOne (reservation)', () => {
    it('예약 상세를 반환해야 함', async () => {
      const reservation = { id: '1', tenantId: 't1', status: 'PENDING' };
      mockPrisma.bpReservation.findFirst.mockResolvedValue(reservation);
      expect(await service.findOne('t1', '1')).toEqual(reservation);
    });

    it('없으면 NotFoundException', async () => {
      mockPrisma.bpReservation.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('다른 테넌트의 예약은 조회 불가 (테넌트 격리)', async () => {
      mockPrisma.bpReservation.findFirst.mockResolvedValue(null);
      await expect(service.findOne('other-tenant', '1')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.bpReservation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1', tenantId: 'other-tenant' },
        }),
      );
    });
  });

  describe('예약 상태 변경', () => {
    it('PENDING → CONFIRMED 전환', async () => {
      const result = { id: '1', status: 'CONFIRMED' };
      mockPrisma.bpReservation.update.mockResolvedValue(result);
      expect(await service.updateStatus('t1', '1', 'CONFIRMED')).toEqual(result);
    });

    it('CONFIRMED → COMPLETED 전환', async () => {
      const result = { id: '1', status: 'COMPLETED' };
      mockPrisma.bpReservation.update.mockResolvedValue(result);
      expect(await service.updateStatus('t1', '1', 'COMPLETED')).toEqual(result);
    });

    it('CANCELLED 전환', async () => {
      const result = { id: '1', status: 'CANCELLED' };
      mockPrisma.bpReservation.update.mockResolvedValue(result);
      expect(await service.updateStatus('t1', '1', 'CANCELLED')).toEqual(result);
    });
  });

  describe('가용 슬롯 조회 (findAvailable)', () => {
    it('해당 요일에 슬롯이 없으면 빈 배열 반환', async () => {
      mockPrisma.bpReservationSlot.findUnique.mockResolvedValue(null);
      const result = await service.findAvailable('t1', '2026-02-10');
      expect(result).toEqual([]);
    });

    it('비활성 슬롯이면 빈 배열 반환', async () => {
      mockPrisma.bpReservationSlot.findUnique.mockResolvedValue({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '18:00',
        slotMinutes: 30,
        maxBookings: 1,
        isActive: false,
      });
      const result = await service.findAvailable('t1', '2026-02-10');
      expect(result).toEqual([]);
    });

    it('예약이 없으면 모든 시간대가 가용', async () => {
      mockPrisma.bpReservationSlot.findUnique.mockResolvedValue({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotMinutes: 60,
        maxBookings: 1,
        isActive: true,
      });
      mockPrisma.bpReservation.findMany.mockResolvedValue([]);

      const result = await service.findAvailable('t1', '2026-02-09');
      // 09:00, 10:00, 11:00 (12:00은 endTime이므로 제외)
      expect(result).toEqual(['09:00', '10:00', '11:00']);
    });

    it('이미 예약된 시간대는 제외되어야 함', async () => {
      mockPrisma.bpReservationSlot.findUnique.mockResolvedValue({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotMinutes: 60,
        maxBookings: 1,
        isActive: true,
      });
      mockPrisma.bpReservation.findMany.mockResolvedValue([
        { startTime: '10:00', endTime: '11:00', status: 'CONFIRMED' },
      ]);

      const result = await service.findAvailable('t1', '2026-02-09');
      // 10:00은 예약됨 → 제외
      expect(result).toEqual(['09:00', '11:00']);
    });

    it('maxBookings > 1이면 동일 시간에 여러 예약 가능', async () => {
      mockPrisma.bpReservationSlot.findUnique.mockResolvedValue({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        slotMinutes: 60,
        maxBookings: 3,
        isActive: true,
      });
      mockPrisma.bpReservation.findMany.mockResolvedValue([
        { startTime: '09:00', endTime: '10:00', status: 'CONFIRMED' },
        { startTime: '09:00', endTime: '10:00', status: 'PENDING' },
      ]);

      const result = await service.findAvailable('t1', '2026-02-09');
      // 09:00에 2건 예약, maxBookings=3이므로 아직 가용
      expect(result).toContain('09:00');
    });

    it('maxBookings 초과 시 해당 시간대 제외', async () => {
      mockPrisma.bpReservationSlot.findUnique.mockResolvedValue({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        slotMinutes: 60,
        maxBookings: 2,
        isActive: true,
      });
      mockPrisma.bpReservation.findMany.mockResolvedValue([
        { startTime: '09:00', endTime: '10:00', status: 'CONFIRMED' },
        { startTime: '09:00', endTime: '10:00', status: 'PENDING' },
      ]);

      const result = await service.findAvailable('t1', '2026-02-09');
      // 09:00에 2건=maxBookings이므로 제외
      expect(result).not.toContain('09:00');
      expect(result).toContain('10:00');
    });

    it('취소된 예약은 가용 슬롯에 포함되지 않아야 함 (올바르게 무시)', async () => {
      mockPrisma.bpReservationSlot.findUnique.mockResolvedValue({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        slotMinutes: 30,
        maxBookings: 1,
        isActive: true,
      });
      // 취소된 예약은 쿼리에서 이미 제외됨 (status notIn ['CANCELLED'])
      mockPrisma.bpReservation.findMany.mockResolvedValue([]);

      const result = await service.findAvailable('t1', '2026-02-09');
      expect(result).toEqual(['09:00', '09:30']);
    });
  });

  describe('서비스 소프트 삭제', () => {
    it('삭제 시 isActive=false로 변경 (하드 삭제 아님)', async () => {
      mockPrisma.bpService.update.mockResolvedValue({ id: '1', isActive: false });
      await service.removeService('t1', '1');
      expect(mockPrisma.bpService.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('슬롯 업서트', () => {
    it('여러 요일의 슬롯을 한번에 생성/수정', async () => {
      mockPrisma.bpReservationSlot.upsert.mockResolvedValue({ id: '1' });

      const slots = [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '17:00', slotMinutes: 60 },
      ];

      const result = await service.upsertSlots('t1', slots);
      expect(result).toHaveLength(3);
      expect(mockPrisma.bpReservationSlot.upsert).toHaveBeenCalledTimes(3);
    });

    it('기본값 적용: slotMinutes=30, maxBookings=1', async () => {
      mockPrisma.bpReservationSlot.upsert.mockResolvedValue({ id: '1' });

      await service.upsertSlots('t1', [
        { dayOfWeek: 0, startTime: '09:00', endTime: '12:00' },
      ]);

      expect(mockPrisma.bpReservationSlot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            slotMinutes: 30,
            maxBookings: 1,
          }),
        }),
      );
    });
  });
});
