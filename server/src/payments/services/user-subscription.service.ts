import { Injectable } from '@nestjs/common';
import { SubscriptionPlan, plans } from '../config/plans';
import { UserSubscriptionRepository } from '../repositories/user-subscription.repository';
import { Prisma, UserSubscription } from '@prisma/client';

@Injectable()
export class UserSubscriptionService {
  constructor(private readonly repo: UserSubscriptionRepository) {}

  async findByUserId(
    userId: string,
  ): Promise<{ sub: UserSubscription | null; plan: SubscriptionPlan }> {
    const sub = await this.repo.findByUserId(userId);

    return {
      sub,
      plan: Object.values(plans).find(
        (p) => p.variantId === (sub?.variantId || null),
      ),
    };
  }

  createForUserId(
    userId: string,
    subscription: Omit<UserSubscription, 'user' | 'id'>,
  ): Promise<UserSubscription> {
    return this.repo.createForUserId(userId, { ...subscription });
  }

  updateByUserId(userId: string, update: Prisma.UserSubscriptionUpdateInput) {
    return this.repo.updateByUserId(userId, update);
  }

  async upsertByUserId(
    userId: string,
    subscription: Omit<UserSubscription, 'userId' | 'id'>,
  ): Promise<UserSubscription> {
    return this.repo.upsertByUserId(userId, { ...subscription });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.deleteByUserId(userId);
  }
}
