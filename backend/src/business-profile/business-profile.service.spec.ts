import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BusinessProfileService } from './business-profile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BusinessProfileService', () => {
  let service: BusinessProfileService;
  const mockPrisma = {
    bpBusinessProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    odTenant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessProfileService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(BusinessProfileService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('프로필을 정상 조회해야 함', async () => {
      const profile = { id: '1', tenantId: 't1', businessName: '테스트' };
      mockPrisma.bpBusinessProfile.findUnique.mockResolvedValue(profile);
      expect(await service.findOne('t1')).toEqual(profile);
    });

    it('프로필이 없으면 null 반환', async () => {
      mockPrisma.bpBusinessProfile.findUnique.mockResolvedValue(null);
      expect(await service.findOne('t1')).toBeNull();
    });
  });

  describe('upsert', () => {
    it('정상적으로 upsert해야 함', async () => {
      const dto = { businessName: '테스트샵', ownerName: '홍길동' } as any;
      const result = { id: '1', tenantId: 't1', ...dto };
      mockPrisma.odTenant.findUnique.mockResolvedValue({ id: 't1' });
      mockPrisma.bpBusinessProfile.upsert.mockResolvedValue(result);
      expect(await service.upsert('t1', dto)).toEqual(result);
    });

    it('존재하지 않는 테넌트에 대해 NotFoundException', async () => {
      mockPrisma.odTenant.findUnique.mockResolvedValue(null);
      await expect(service.upsert('bad', {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});
