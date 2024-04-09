import { BadRequestException, Injectable } from '@nestjs/common';
import { UserSubscriptionService } from './user-subscription.service';

@Injectable()
export class PlanCheckerService {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async canPublishChat(userId: string): Promise<void> {
    const { plan } = await this.userSubscriptionService.findByUserId(userId);

    if (!plan.limits.publish) {
      throw new BadRequestException('Please turn PRO to publish chat');
    }
  }

  async withinResourcesLimit(
    userId: string,
    resourcesCount: number,
  ): Promise<void> {
    const { plan } = await this.userSubscriptionService.findByUserId(userId);

    if (resourcesCount > plan.limits.resources) {
      throw new BadRequestException(
        'Please turn pro to add more resources your plan has a maximum of: ' +
          plan.limits.resources,
      );
    }
  }
}
