import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { RateLimitConsumeOptions } from '@src/infra/rate-limiter/rate-limiter.service';

export const RATE_LIMIT_OPTIONS = 'rateLimit';

export interface RateLimitOptions extends RateLimitConsumeOptions {
  errorMessage?: string;
  omitResponseHeaders?: boolean;
  getKey?: (request: Request) => string;
}

export const RateLimit = (options: RateLimitOptions): MethodDecorator =>
  SetMetadata(RATE_LIMIT_OPTIONS, options);
