import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@src/database/prisma.service';

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
      data,
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
    });
  }

  findFirstById(id: string) {
    return this.prisma.chat.findFirst({
      where: { id },
    });
  }

  incrementPoints(id: string) {
    return this.prisma.chat.update({
      where: { id },
      data: { points: { increment: 1 } },
    });
  }
}
