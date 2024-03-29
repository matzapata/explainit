import { Injectable } from '@nestjs/common';
import { Prisma, WebhookEvent } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class WebhookEventsRepository {
  constructor(private prisma: PrismaService) {}

  async createWebhookEvent(
    data: Prisma.WebhookEventCreateInput,
  ): Promise<WebhookEvent> {
    return this.prisma.webhookEvent.create({ data });
  }

  async updateWebhookEvent(
    id: number,
    data: Prisma.WebhookEventUpdateInput,
  ): Promise<WebhookEvent> {
    return this.prisma.webhookEvent.update({ where: { id }, data });
  }
}
