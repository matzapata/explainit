import { Injectable } from '@nestjs/common';
import type { RedisService } from '@src/infra/redis/redis.service';
import { RateLimiterRedis } from 'rate-limiter-flexible';

export interface RateLimitConsumeOptions {
  keyPrefix: string;
  points: number;
  duration: number;
  pointsConsumed?: number;
}

@Injectable()
export class RateLimiterService {
  private readonly limiters = new Map<string, RateLimiterRedis>();

  constructor(private readonly redis: RedisService) {}

  consume(options: RateLimitConsumeOptions, key: string) {
    return this.getLimiter(options).consume(key, options.pointsConsumed ?? 1);
  }

  private getLimiter(options: RateLimitConsumeOptions): RateLimiterRedis {
    const cached = this.limiters.get(options.keyPrefix);
    if (cached) {
      return cached;
    }

    const limiter = new RateLimiterRedis({
      storeClient: this.redis.getClient(),
      keyPrefix: options.keyPrefix,
      points: options.points,
      duration: options.duration,
    });
    this.limiters.set(options.keyPrefix, limiter);
    return limiter;
  }
}
