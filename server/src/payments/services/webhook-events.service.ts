import { Injectable } from '@nestjs/common';
import { WebhookEventsRepository } from '../repositories/webhook-events.repository';
import { Prisma, WebhookEvent } from '@prisma/client';

@Injectable()
export class WebhookEventsService {
  constructor(private readonly repo: WebhookEventsRepository) {}

  async create(event: Prisma.WebhookEventCreateInput): Promise<WebhookEvent> {
    return this.repo.createWebhookEvent(event);
  }

  async setProcessed(
    id: number,
    processed: boolean,
    processingError?: string,
  ): Promise<WebhookEvent> {
    return this.repo.updateWebhookEvent(id, { processed, processingError });
  }
}
