import { Injectable } from '@nestjs/common';
import { ResourcesRepository } from '../repositories/resources.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private readonly resourcesRepository: ResourcesRepository) {}

  create(chatId: string, data: Omit<Prisma.ChatResourceCreateInput, 'chat'>) {
    return this.resourcesRepository.create({
      ...data,
      chat: { connect: { id: chatId } },
    });
  }

  findById(id: string) {
    return this.resourcesRepository.findById(id);
  }

  findByChatId(chatId: string) {
    return this.resourcesRepository.findByChatId(chatId);
  }

  findByUrl(chatId: string, url: string) {
    return this.resourcesRepository.findByUrl(chatId, url);
  }

  delete(id: string) {
    return this.resourcesRepository.delete(id);
  }
}
