import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@src/infra/database/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ChatCreateInput) {
    return this.prisma.chat.create({
      data,
    });
  }

  update(owner: string, id: string, data: Prisma.ChatUpdateInput) {
    return this.prisma.chat.update({
      where: {
        id,
        ownerId: owner,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  findFirstByOwner(ownerId: string) {
    return this.prisma.chat.findFirst({
      where: { ownerId },
    });
  }

  findManyByOwner(ownerId: string) {
    return this.prisma.chat.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findFirstById(id: string) {
    return this.prisma.chat.findFirst({
      where: { id },
    });
  }

  delete(id: string) {
    return this.prisma.chat.delete({
      where: { id },
    });
  }

  incrementPoints(id: string) {
    return this.prisma.chat.update({
      where: { id },
      data: {
        points: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }
}
