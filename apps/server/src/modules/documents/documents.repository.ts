import { Injectable } from '@nestjs/common';
import type { Prisma, ResourceStatus } from '@prisma/client';
import { PrismaService } from '@src/infra/database/prisma.service';

@Injectable()
export class DocumentsRepository {
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

  findByUrl(chatId: string, url: string) {
    return this.prisma.chatResource.findFirst({
      where: {
        chatId,
        data: {
          equals: url,
          mode: 'insensitive',
        },
      },
    });
  }

  findByCrawlIdAndStatuses(crawlId: string, statuses: ResourceStatus[]) {
    return this.prisma.chatResource.findMany({
      where: {
        crawlId,
        status: { in: statuses },
      },
    });
  }

  update(id: string, data: Prisma.ChatResourceUpdateInput) {
    return this.prisma.chatResource.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.chatResource.delete({
      where: { id },
    });
  }
}
