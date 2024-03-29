import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UserSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createForUserId(
    userId: string,
    data: Omit<Prisma.UserSubscriptionCreateInput, 'user'>,
  ) {
    return this.prisma.userSubscription.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.userSubscription.findFirst({
      where: { userId },
    });
  }

  updateByUserId(userId: string, data: Prisma.UserSubscriptionUpdateInput) {
    return this.prisma.userSubscription.update({ where: { userId }, data });
  }

  upsertByUserId(
    userId: string,
    data: Omit<Prisma.UserSubscriptionCreateInput, 'user'>,
  ) {
    return this.prisma.userSubscription.upsert({
      where: { userId },
      create: { ...data, user: { connect: { id: userId } } },
      update: data,
    });
  }

  deleteByUserId(userId: string) {
    return this.prisma.userSubscription.delete({ where: { userId } });
  }
}
