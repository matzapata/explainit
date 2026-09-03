import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimiterRes } from 'rate-limiter-flexible';
import {
  RATE_LIMIT_OPTIONS,
  RateLimitOptions,
} from '@src/infra/http/decorators/rate-limit.decorator';
import { RateLimiterService } from '@src/infra/rate-limiter/rate-limiter.service';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_OPTIONS,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const key = options.getKey?.(request) || request.ip || 'anonymous';

    try {
      const result = await this.rateLimiter.consume(
        {
          keyPrefix: options.keyPrefix,
          points: options.points,
          duration: options.duration,
          pointsConsumed: options.pointsConsumed,
        },
        key,
      );
      this.setHeaders(response, options, result);
      return true;
    } catch (error) {
      if (!(error instanceof RateLimiterRes)) {
        throw error;
      }
      this.setHeaders(response, options, error);
      throw new HttpException(
        options.errorMessage ?? 'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private setHeaders(
    response: Response,
    options: RateLimitOptions,
    result: RateLimiterRes,
  ) {
    if (options.omitResponseHeaders) {
      return;
    }

    response.setHeader('Retry-After', Math.ceil(result.msBeforeNext / 1000));
    response.setHeader('X-RateLimit-Limit', options.points);
    response.setHeader('X-RateLimit-Remaining', result.remainingPoints);
    response.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + result.msBeforeNext).toUTCString(),
    );
  }
}
