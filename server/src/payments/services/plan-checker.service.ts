import { BadRequestException, Injectable } from '@nestjs/common';
import { UserSubscriptionService } from './user-subscription.service';

// TODO: We can improve this by using redis

@Injectable()
export class PlanCheckerService {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async canUploadDocument(
    userId: string,
    documentsCount: number,
  ): Promise<void> {
    const { plan } = await this.userSubscriptionService.findByUserId(userId);
    const uploadLimit = plan.limits.maxDocuments;

    if (uploadLimit === 0) {
      throw new BadRequestException('You have reached your document limit');
    }

    // get documents count
    if (documentsCount >= uploadLimit) {
      throw new BadRequestException('You have reached your document limit');
    }
  }

  async canSendMessage(userId: string, messageCount): Promise<void> {
    const { plan } = await this.userSubscriptionService.findByUserId(userId);
    const messageLimit = plan.limits.maxMessages;

    if (messageLimit === 0) {
      throw new BadRequestException('You have reached your message limit');
    }

    if (messageCount >= messageLimit) {
      throw new BadRequestException('You have reached your message limit');
    }
  }
}
