import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ChatCreateInput) {
    return this.prisma.chat.create({
      data,
    });
  }

  update(owner: string, data: Prisma.ChatUpdateInput) {
    return this.prisma.chat.update({
      where: {
        ownerId: owner,
      },
      data,
    });
  }

  findByOwner(ownerId: string) {
    return this.prisma.chat.findFirst({
      where: {
        ownerId,
      },
    });
  }

  findById(id: string) {
    return this.prisma.chat.findFirst({
      where: {
        id,
      },
    });
  }
}
