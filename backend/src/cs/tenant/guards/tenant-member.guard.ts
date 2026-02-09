import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TenantMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.params.tenantId || request.headers['x-tenant-id'];

    if (!user || !tenantId) {
      throw new ForbiddenException('Tenant access denied');
    }

    const membership = await this.prisma.odTenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      include: { tenant: true },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this tenant');
    }

    request.tenant = membership.tenant;
    request.tenantMembership = membership;
    return true;
  }
}
