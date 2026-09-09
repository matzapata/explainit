import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '@src/infra/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOrCreate(email: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return existing;
    }

    const owner = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (owner) {
      return this.prisma.user.update({
        where: { id: owner.id },
        data: { email },
      });
    }

    return this.prisma.user.create({ data: { email } });
  }
}
