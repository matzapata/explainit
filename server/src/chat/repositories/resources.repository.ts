import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@src/database/prisma.service';

@Injectable()
export class ResourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ChatResourceCreateInput) {
    return this.prisma.chatResource.create({
      data,
    });
  }

  findById(id: string) {
    return this.prisma.chatResource.findUnique({
      where: { id },
    });
  }

  findByChatId(chatId: string) {
    return this.prisma.chatResource.findMany({
      where: { chatId },
    });
  }

  delete(id: string) {
    return this.prisma.chatResource.delete({
      where: { id },
    });
  }
}
