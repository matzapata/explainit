import type { RedisService } from '@src/infra/redis/redis.service';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { RateLimiterService } from './rate-limiter.service';

jest.mock('rate-limiter-flexible', () => ({
  RateLimiterRedis: jest.fn(),
}));

describe('RateLimiterService', () => {
  const consume = jest.fn();
  const redis = {
    getClient: jest.fn().mockReturnValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consume.mockResolvedValue(undefined);
    (RateLimiterRedis as unknown as jest.Mock).mockImplementation(() => ({
      consume,
    }));
  });

  it('reuses a limiter per keyPrefix and forwards consume', async () => {
    const service = new RateLimiterService(redis as unknown as RedisService);
    const options = { keyPrefix: 'chat-messages', points: 10, duration: 60 };

    await service.consume(options, 'chat-1');
    await service.consume({ ...options, pointsConsumed: 2 }, 'chat-1');

    expect(RateLimiterRedis).toHaveBeenCalledTimes(1);
    expect(RateLimiterRedis).toHaveBeenCalledWith({
      storeClient: {},
      keyPrefix: 'chat-messages',
      points: 10,
      duration: 60,
    });
    expect(consume).toHaveBeenNthCalledWith(1, 'chat-1', 1);
    expect(consume).toHaveBeenNthCalledWith(2, 'chat-1', 2);
  });
});
