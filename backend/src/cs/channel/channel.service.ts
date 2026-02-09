import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateChannelDto) {
    return this.prisma.odChannel.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type,
        ...(dto.config && { config: dto.config as any }),
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.odChannel.findMany({
      where: { tenantId },
      include: { _count: { select: { widgets: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const channel = await this.prisma.odChannel.findFirst({
      where: { id, tenantId },
      include: { widgets: true },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async update(tenantId: string, id: string, dto: UpdateChannelDto) {
    await this.findById(tenantId, id);
    const { config, ...rest } = dto;
    return this.prisma.odChannel.update({
      where: { id },
      data: { ...rest, ...(config && { config: config as any }) },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.odChannel.delete({ where: { id } });
  }
}
