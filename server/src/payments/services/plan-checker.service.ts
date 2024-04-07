import { BadRequestException, Injectable } from '@nestjs/common';
import { UserSubscriptionService } from './user-subscription.service';
import { plans } from '../config/plans';

@Injectable()
export class PlanCheckerService {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async canPublishChat(userId: string): Promise<void> {
    const { plan } = await this.userSubscriptionService.findByUserId(userId);

    if (plan.limits.resources === 0) {
      throw new BadRequestException('Please turn pro to publish chat');
    }
  }

  async canAddResource(userId: string): Promise<void> {
    const { plan } = await this.userSubscriptionService.findByUserId(userId);

    if (plan.limits.resources === 0) {
      throw new BadRequestException('Please turn pro to add resources');
    }
  }

  async canSendMessage(messageCount: number): Promise<void> {
    if (messageCount > plans.pro.limits.messagesPerDay) {
      throw new BadRequestException(
        'Chat has reached the messages limit per day',
      );
    }
  }
}
