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

  update(
    owner: string,
    id: string,
    data: Omit<Prisma.ChatUpdateInput, 'owner'>,
  ) {
    return this.chatRepository.update(owner, id, data);
  }

  findFirstByOwner(ownerId: string) {
    return this.chatRepository.findFirstByOwner(ownerId);
  }

  findManyByOwner(ownerId: string) {
    return this.chatRepository.findManyByOwner(ownerId);
  }

  findFirstById(id: string) {
    return this.chatRepository.findFirstById(id);
  }

  findManyPublished(limit: number, offset: number) {
    return this.chatRepository.findManyPublished(limit, offset);
  }

  incrementPoints(id: string) {
    return this.chatRepository.incrementPoints(id);
  }
}
