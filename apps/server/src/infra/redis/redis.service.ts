import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvService } from '@src/infra/env/env.service';

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
