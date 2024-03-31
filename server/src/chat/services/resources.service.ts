import { Injectable } from '@nestjs/common';
import { ResourcesRepository } from '../repositories/resources.repository';

@Injectable()
export class ResourcesService {
  constructor(private readonly resourcesRepository: ResourcesRepository) {}

  findById(id: number) {
    return this.resourcesRepository.findById(id);
  }

  delete(id: number) {
    return this.resourcesRepository.delete(id);
  }
}
