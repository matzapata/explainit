import { MimeType } from 'src/infrastructure/vectorstore/vectorstore.service';
import { ChatRepository } from '../repositories/chat.repository';
import { Chat, Message, MessageAgent, Prisma } from '@prisma/client';
import { MessagesRepository } from '../repositories/messages.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  async create(
    ownerId: string,
    filename: string,
    filesize: number,
    mimetype: MimeType,
    embeddingsIds: string[],
  ): Promise<Chat> {
    return this.chatRepository.create(ownerId, {
      filename: filename,
      filesize: filesize,
      embeddingsIds: embeddingsIds,
      mimetype,
    });
  }

  async delete(id: string) {
    return this.chatRepository.delete(id);
  }

  async findAllOwnedBy(ownerId: string): Promise<Chat[]> {
    return this.chatRepository.findByOwnerId(ownerId);
  }

  async findFileForOwner(
    ownerId: string,
    filename: string,
  ): Promise<Chat | null> {
    return this.chatRepository.findByFilename(ownerId, filename);
  }

  async findById(id: string, include?: Prisma.ChatInclude) {
    return this.chatRepository.findById(id, include);
  }

  async addMessage(
    id: string,
    message: string,
    agent: MessageAgent,
  ): Promise<Message> {
    return this.messagesRepository.create(id, {
      agent,
      message,
    });
  }

  async addMessages(
    id: string,
    messages: { message: string; agent: MessageAgent }[],
  ): Promise<Message[]> {
    const chatMessages = messages.map((m) =>
      this.messagesRepository.create(id, {
        agent: m.agent,
        message: m.message,
      }),
    );
    return await Promise.all(chatMessages);
  }

  async countMessagesByOwner(
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.messagesRepository.countByOwnerBetweenDates(ownerId, from, to);
  }

  countDocumentsByOwner(ownerId: string): Promise<number> {
    return this.chatRepository.countByOwner(ownerId);
  }

  deleteAllByChatId(id: string) {
    return this.messagesRepository.deleteAllByChatId(id);
  }
}
