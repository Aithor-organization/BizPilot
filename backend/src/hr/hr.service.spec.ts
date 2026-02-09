import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { HrService } from './hr.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HrService', () => {
  let service: HrService;
  const mockPrisma = {
    bpEmployee: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    bpAttendance: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    bpLeave: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(HrService);
    jest.clearAllMocks();
  });

  describe('createEmployee', () => {
    it('직원을 정상 등록해야 함', async () => {
      const dto = { name: '김직원', role: '매니저' };
      const result = { id: '1', tenantId: 't1', ...dto };
      mockPrisma.bpEmployee.create.mockResolvedValue(result);
      expect(await service.createEmployee('t1', dto)).toEqual(result);
    });
  });

  describe('findAllEmployees', () => {
    it('활성 직원만 반환해야 함 (기본)', async () => {
      mockPrisma.bpEmployee.findMany.mockResolvedValue([]);
      await service.findAllEmployees('t1');
      expect(mockPrisma.bpEmployee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't1', isActive: true } }),
      );
    });

    it('비활성 포함 조회', async () => {
      mockPrisma.bpEmployee.findMany.mockResolvedValue([]);
      await service.findAllEmployees('t1', true);
      expect(mockPrisma.bpEmployee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't1' } }),
      );
    });
  });

  describe('findOneEmployee', () => {
    it('직원 상세를 반환해야 함', async () => {
      const emp = { id: '1', name: '김직원', attendances: [], leaves: [] };
      mockPrisma.bpEmployee.findFirst.mockResolvedValue(emp);
      expect(await service.findOneEmployee('t1', '1')).toEqual(emp);
    });

    it('없으면 NotFoundException', async () => {
      mockPrisma.bpEmployee.findFirst.mockResolvedValue(null);
      await expect(service.findOneEmployee('t1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('clockIn', () => {
    it('정상 출근 체크해야 함', async () => {
      mockPrisma.bpAttendance.findUnique.mockResolvedValue(null);
      const result = { id: '1', clockIn: new Date(), status: 'PRESENT' };
      mockPrisma.bpAttendance.upsert.mockResolvedValue(result);
      expect(await service.clockIn('t1', 'e1')).toEqual(result);
    });

    it('이미 출근했으면 BadRequestException', async () => {
      mockPrisma.bpAttendance.findUnique.mockResolvedValue({ clockIn: new Date() });
      await expect(service.clockIn('t1', 'e1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('clockOut', () => {
    it('정상 퇴근 체크해야 함', async () => {
      const clockInTime = new Date();
      clockInTime.setHours(clockInTime.getHours() - 8);
      mockPrisma.bpAttendance.findUnique.mockResolvedValue({ clockIn: clockInTime, clockOut: null, breakMinutes: 0 });
      const result = { id: '1', clockOut: new Date() };
      mockPrisma.bpAttendance.update.mockResolvedValue(result);
      expect(await service.clockOut('t1', 'e1')).toEqual(result);
    });

    it('출근 안했으면 BadRequestException', async () => {
      mockPrisma.bpAttendance.findUnique.mockResolvedValue(null);
      await expect(service.clockOut('t1', 'e1')).rejects.toThrow(BadRequestException);
    });

    it('이미 퇴근했으면 BadRequestException', async () => {
      mockPrisma.bpAttendance.findUnique.mockResolvedValue({ clockIn: new Date(), clockOut: new Date() });
      await expect(service.clockOut('t1', 'e1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createLeave', () => {
    it('휴가를 정상 신청해야 함', async () => {
      const dto = { employeeId: 'e1', type: 'ANNUAL', startDate: '2026-03-01', endDate: '2026-03-03' };
      const result = { id: '1', ...dto, days: 3, status: 'PENDING' };
      mockPrisma.bpLeave.create.mockResolvedValue(result);
      expect(await service.createLeave('t1', dto)).toEqual(result);
    });
  });

  describe('approveLeave', () => {
    it('휴가를 승인해야 함', async () => {
      const result = { id: '1', status: 'APPROVED' };
      mockPrisma.bpLeave.update.mockResolvedValue(result);
      expect(await service.approveLeave('t1', '1', 'APPROVED')).toEqual(result);
    });

    it('휴가 거절도 처리해야 함', async () => {
      const result = { id: '1', status: 'REJECTED', approvedBy: 'admin-1' };
      mockPrisma.bpLeave.update.mockResolvedValue(result);
      expect(await service.approveLeave('t1', '1', 'REJECTED', 'admin-1')).toEqual(result);
      expect(mockPrisma.bpLeave.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'REJECTED', approvedBy: 'admin-1' },
        include: { employee: { select: { id: true, name: true } } },
      });
    });
  });

  // ─── 비즈니스 크리티컬 Edge Cases ───

  describe('근무시간 계산 정확성', () => {
    it('퇴근 시 총 근무 분에서 break 시간을 차감해야 함', async () => {
      const clockIn = new Date();
      clockIn.setHours(clockIn.getHours() - 9); // 9시간 전 출근
      mockPrisma.bpAttendance.findUnique.mockResolvedValue({
        clockIn,
        clockOut: null,
        breakMinutes: 60, // 점심 1시간
      });
      mockPrisma.bpAttendance.update.mockImplementation(({ data }: any) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.clockOut('t1', 'e1');

      const callData = mockPrisma.bpAttendance.update.mock.calls[0][0].data;
      // 9시간 = 540분, break 60분 차감 = 480분
      // 오차 허용 (테스트 실행 시간 1분 미만)
      expect(callData.totalMinutes).toBeGreaterThanOrEqual(479);
      expect(callData.totalMinutes).toBeLessThanOrEqual(481);
    });

    it('break 시간이 0이면 전체 근무시간이 totalMinutes', async () => {
      const clockIn = new Date();
      clockIn.setHours(clockIn.getHours() - 4); // 4시간 전 출근
      mockPrisma.bpAttendance.findUnique.mockResolvedValue({
        clockIn,
        clockOut: null,
        breakMinutes: 0,
      });
      mockPrisma.bpAttendance.update.mockImplementation(({ data }: any) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.clockOut('t1', 'e1');

      const callData = mockPrisma.bpAttendance.update.mock.calls[0][0].data;
      expect(callData.totalMinutes).toBeGreaterThanOrEqual(239);
      expect(callData.totalMinutes).toBeLessThanOrEqual(241);
    });
  });

  describe('휴가 일수 자동 계산', () => {
    it('3일 연차 (03/01~03/03) → days = 3', async () => {
      mockPrisma.bpLeave.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.createLeave('t1', {
        employeeId: 'e1',
        type: 'ANNUAL',
        startDate: '2026-03-01',
        endDate: '2026-03-03',
      });

      expect(mockPrisma.bpLeave.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ days: 3 }),
        }),
      );
    });

    it('1일 휴가 (같은 날) → days = 1', async () => {
      mockPrisma.bpLeave.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.createLeave('t1', {
        employeeId: 'e1',
        type: 'ANNUAL',
        startDate: '2026-03-10',
        endDate: '2026-03-10',
      });

      expect(mockPrisma.bpLeave.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ days: 1 }),
        }),
      );
    });

    it('수동 days 지정 시 해당 값 사용', async () => {
      mockPrisma.bpLeave.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.createLeave('t1', {
        employeeId: 'e1',
        type: 'ANNUAL',
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        days: 3, // 주말 제외 수동 입력
      });

      expect(mockPrisma.bpLeave.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ days: 3 }),
        }),
      );
    });
  });

  describe('출근/퇴근 중복 방지', () => {
    it('이미 퇴근한 상태에서 재퇴근 시 BadRequestException', async () => {
      const clockIn = new Date('2026-02-09T09:00:00');
      const clockOut = new Date('2026-02-09T18:00:00');
      mockPrisma.bpAttendance.findUnique.mockResolvedValue({ clockIn, clockOut, breakMinutes: 0 });
      await expect(service.clockOut('t1', 'e1')).rejects.toThrow('Already clocked out today');
    });

    it('출근 기록 없이 퇴근 시 BadRequestException', async () => {
      mockPrisma.bpAttendance.findUnique.mockResolvedValue({ clockIn: null, clockOut: null, breakMinutes: 0 });
      await expect(service.clockOut('t1', 'e1')).rejects.toThrow('Must clock in first');
    });
  });

  describe('직원 비활성화', () => {
    it('비활성화 시 isActive=false, endDate 설정', async () => {
      mockPrisma.bpEmployee.update.mockImplementation(({ data }) => {
        return Promise.resolve({ id: '1', ...data });
      });

      await service.deactivateEmployee('t1', 'e1');

      expect(mockPrisma.bpEmployee.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: expect.objectContaining({
          isActive: false,
          endDate: expect.any(Date),
        }),
      });
    });
  });

  describe('근태 요약 집계', () => {
    it('직원별 출근/결근/지각 일수를 올바르게 집계해야 함', async () => {
      mockPrisma.bpAttendance.findMany.mockResolvedValue([
        { employeeId: 'e1', status: 'PRESENT', totalMinutes: 480, employee: { id: 'e1', name: '김직원' } },
        { employeeId: 'e1', status: 'PRESENT', totalMinutes: 450, employee: { id: 'e1', name: '김직원' } },
        { employeeId: 'e1', status: 'LATE', totalMinutes: 400, employee: { id: 'e1', name: '김직원' } },
        { employeeId: 'e2', status: 'ABSENT', totalMinutes: 0, employee: { id: 'e2', name: '이직원' } },
      ]);

      const result = await service.getAttendanceSummary('t1', {});

      const e1 = result.find((r) => r.employeeId === 'e1');
      expect(e1).toBeDefined();
      expect(e1!.presentDays).toBe(2);
      expect(e1!.lateDays).toBe(1);
      expect(e1!.totalMinutes).toBe(1330);
      expect(e1!.totalHours).toBe(22.2); // Math.round(1330/60 * 10) / 10

      const e2 = result.find((r) => r.employeeId === 'e2');
      expect(e2).toBeDefined();
      expect(e2!.absentDays).toBe(1);
    });
  });
});
