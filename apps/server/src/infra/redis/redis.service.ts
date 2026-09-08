import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { EnvService } from '@src/infra/env/env.service';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(env: EnvService) {
    this.client = new Redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
