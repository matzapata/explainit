import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, data: Omit<Prisma.ChatCreateInput, 'owner'>) {
    return this.prisma.chat.create({
      data: {
        ...data,
        owner: { connect: { id: ownerId } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.chat.delete({ where: { id } });
  }

  async findById(id: string, include?: Prisma.ChatInclude) {
    return this.prisma.chat.findUnique({
      where: { id },
      include,
    });
  }

  async findByOwnerId(ownerId: string, include?: Prisma.ChatInclude) {
    return this.prisma.chat.findMany({
      where: { ownerId },
      include,
    });
  }

  async findByFilename(
    ownerId: string,
    filename: string,
    include?: Prisma.ChatInclude,
  ) {
    return this.prisma.chat.findFirst({
      where: { ownerId, filename },
      include,
    });
  }

  async countByOwner(ownerId: string) {
    return this.prisma.chat.count({ where: { ownerId } });
  }
}
