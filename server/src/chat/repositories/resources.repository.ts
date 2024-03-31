import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';

@Injectable()
export class ResourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.chatResource.findFirst({
      where: { id },
    });
  }

  delete(id: number) {
    return this.prisma.chatResource.delete({
      where: { id },
    });
  }
}
