import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { RateLimitOptions } from '@src/infra/http/decorators/rate-limit.decorator';
import { RateLimiterService } from '@src/infra/rate-limiter/rate-limiter.service';
import { RateLimiterGuard } from './rate-limiter.guard';

describe('RateLimiterGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const rateLimiter = {
    consume: jest.fn(),
  };
  const guard = new RateLimiterGuard(
    reflector as unknown as Reflector,
    rateLimiter as unknown as RateLimiterService,
  );

  const options: RateLimitOptions = {
    keyPrefix: 'chat-messages',
    points: 10,
    duration: 60,
    getKey: (req) => req.params.id,
  };

  const createContext = (
    req: Record<string, unknown> = {},
    res: { setHeader: jest.Mock } = { setHeader: jest.fn() },
  ) => ({
    getHandler: () => jest.fn(),
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows requests when no @RateLimit is set', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(createContext() as never)).resolves.toBe(
      true,
    );
    expect(rateLimiter.consume).not.toHaveBeenCalled();
  });

  it('consumes a point and sets rate limit headers', async () => {
    reflector.getAllAndOverride.mockReturnValue(options);
    rateLimiter.consume.mockResolvedValue(
      new RateLimiterRes(9, 60_000, 1, false),
    );
    const res = { setHeader: jest.fn() };

    await expect(
      guard.canActivate(
        createContext(
          { params: { id: 'chat-1' }, ip: '1.1.1.1' },
          res,
        ) as never,
      ),
    ).resolves.toBe(true);

    expect(rateLimiter.consume).toHaveBeenCalledWith(
      {
        keyPrefix: 'chat-messages',
        points: 10,
        duration: 60,
        pointsConsumed: undefined,
      },
      'chat-1',
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 60);
  });

  it('falls back to the request IP when getKey is omitted', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      keyPrefix: 'global',
      points: 4,
      duration: 1,
    });
    rateLimiter.consume.mockResolvedValue(
      new RateLimiterRes(3, 1000, 1, false),
    );

    await expect(
      guard.canActivate(createContext({ ip: '203.0.113.10' }) as never),
    ).resolves.toBe(true);

    expect(rateLimiter.consume).toHaveBeenCalledWith(
      expect.objectContaining({ keyPrefix: 'global' }),
      '203.0.113.10',
    );
  });

  it('throws 429 when the limit is exceeded', async () => {
    reflector.getAllAndOverride.mockReturnValue(options);
    rateLimiter.consume.mockRejectedValue(
      new RateLimiterRes(0, 30_000, 10, false),
    );
    const res = { setHeader: jest.fn() };

    const error = await guard
      .canActivate(createContext({ params: { id: 'chat-1' } }, res) as never)
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 30);
  });
});
