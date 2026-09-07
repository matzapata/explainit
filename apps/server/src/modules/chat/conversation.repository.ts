import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/infra/database/prisma.service';

type NewMessage = {
  conversationId: string;
  chatId: string;
  role: string;
  content: string;
  context?: object | null;
  pageUrl?: string | null;
  selectedText?: string | null;
};

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  create(chatId: string, id?: string) {
    return this.prisma.conversation.create({
      data: {
        ...(id ? { id } : {}),
        chatId,
      },
    });
  }

  touch(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  createMessages(data: NewMessage[]) {
    return this.prisma.message.createMany({ data });
  }
}
