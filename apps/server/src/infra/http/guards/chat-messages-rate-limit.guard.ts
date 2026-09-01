import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '@src/infra/database/prisma.service';
import { RateLimiterPrisma } from 'rate-limiter-flexible';

@Injectable()
export class ChatMessagesRateLimit implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const key = req.params.id;

    const rateLimiter = new RateLimiterPrisma({
      keyPrefix: '',
      tableName: 'chatRateLimit',
      storeType: 'prisma',
      storeClient: this.prisma,

      // 10 messages per minute
      points: 10,
      duration: 60,
    });

    return rateLimiter
      .consume(key, 1)
      .then(() => true)
      .catch(() => false);
  }
}
