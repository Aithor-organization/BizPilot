import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBusinessProfileDto } from './dto/upsert-business-profile.dto';

@Injectable()
export class BusinessProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(tenantId: string) {
    return this.prisma.bpBusinessProfile.findUnique({
      where: { tenantId },
    });
  }

  async upsert(tenantId: string, dto: UpsertBusinessProfileDto) {
    // Verify tenant exists
    const tenant = await this.prisma.odTenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return this.prisma.bpBusinessProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
        businessName: dto.businessName,
        ownerName: dto.ownerName,
        bizNumber: dto.bizNumber,
        address: dto.address,
        phone: dto.phone,
        openTime: dto.openTime ?? '09:00',
        closeTime: dto.closeTime ?? '18:00',
        closedDays: dto.closedDays ?? [],
        currency: dto.currency ?? 'KRW',
        timezone: dto.timezone ?? 'Asia/Seoul',
        settings: (dto.settings ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        businessName: dto.businessName,
        ownerName: dto.ownerName,
        bizNumber: dto.bizNumber,
        address: dto.address,
        phone: dto.phone,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        closedDays: dto.closedDays,
        currency: dto.currency,
        timezone: dto.timezone,
        settings: dto.settings as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
