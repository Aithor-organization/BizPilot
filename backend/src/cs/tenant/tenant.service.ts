import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTenantDto) {
    const existing = await this.prisma.odTenant.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Slug already taken');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.odTenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          plan: dto.plan || 'BASIC',
          ownerId: userId,
        },
      });

      await tx.odTenantMember.create({
        data: { tenantId: tenant.id, userId, role: 'OWNER' },
      });

      // 기본 크레딧 계정 생성
      await tx.odCreditAccount.create({
        data: {
          tenantId: tenant.id,
          balance: dto.plan === 'PRO' ? 5000 : dto.plan === 'ENTERPRISE' ? 20000 : 1000,
        },
      });

      // 기본 WEB_CHAT 채널 생성
      await tx.odChannel.create({
        data: { tenantId: tenant.id, type: 'WEB_CHAT', name: 'Web Chat' },
      });

      return tenant;
    });
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.odTenantMember.findMany({
      where: { userId },
      include: { tenant: { include: { creditAccount: true } } },
    });
    return memberships.map((m) => ({ ...m.tenant, role: m.role }));
  }

  async findById(tenantId: string) {
    const tenant = await this.prisma.odTenant.findUnique({
      where: { id: tenantId },
      include: { creditAccount: true, _count: { select: { conversations: true, documents: true, brainPatterns: true } } },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    const { settings, ...rest } = dto;
    return this.prisma.odTenant.update({
      where: { id: tenantId },
      data: { ...rest, ...(settings && { settings: settings as any }) },
    });
  }

  async delete(tenantId: string) {
    return this.prisma.odTenant.delete({ where: { id: tenantId } });
  }

  async addMember(tenantId: string, userId: string, role: string = 'AGENT') {
    return this.prisma.odTenantMember.create({
      data: { tenantId, userId, role },
    });
  }

  async removeMember(tenantId: string, userId: string) {
    return this.prisma.odTenantMember.delete({
      where: { tenantId_userId: { tenantId, userId } },
    });
  }

  async getMembers(tenantId: string) {
    return this.prisma.odTenantMember.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }
}
