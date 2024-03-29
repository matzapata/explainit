import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(chatId: string, data: Omit<Prisma.MessageCreateInput, 'chat'>) {
    return this.prisma.message.create({
      data: {
        ...data,
        chat: { connect: { id: chatId } },
      },
    });
  }

  async deleteAllByChatId(chatId: string) {
    return this.prisma.message.deleteMany({ where: { chatId } });
  }

  async findByChatId(chatId: string, include?: Prisma.MessageInclude) {
    return this.prisma.message.findMany({
      where: { chatId },
      include,
    });
  }

  async countByOwnerBetweenDates(
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.prisma.message.count({
      where: {
        chat: { ownerId },
        createdAt: {
          gte: from,
          lte: to,
        },
      },
    });
  }
}
