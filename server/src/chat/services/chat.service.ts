import { Prisma } from '@prisma/client';
import { ChatRepository } from '../repositories/chat.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatsService {
  constructor(private readonly chatRepository: ChatRepository) {}

  create(owner: string, data: Omit<Prisma.ChatCreateInput, 'owner'>) {
    return this.chatRepository.create({
      ...data,
      owner: { connect: { id: owner } },
    });
  }

  update(owner: string, data: Omit<Prisma.ChatUpdateInput, 'owner'>) {
    return this.chatRepository.update(owner, data);
  }

  findByOwner(ownerId: string) {
    return this.chatRepository.findByOwner(ownerId);
  }

  findById(id: string) {
    return this.chatRepository.findById(id);
  }

  findPublished(limit: number, offset: number) {
    return this.chatRepository.findPublished(limit, offset);
  }

  incrementPoints(id: string) {
    return this.chatRepository.incrementPoints(id);
  }
}
