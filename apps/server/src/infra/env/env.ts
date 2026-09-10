import { z } from 'zod';

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', ''].includes(normalized)) {
      return false;
    }
    return Boolean(value);
  });

const optionalNonEmpty = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().min(1).optional(),
);

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('production'),
    PORT: z.coerce.number().default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    OPENROUTER_API_KEY: z.string().min(1),
    OPENROUTER_BASE_URL: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z.string().url().default('https://openrouter.ai/api/v1'),
    ),
    OPENROUTER_MODEL: z.string().min(1).default('openai/gpt-4o-mini'),
    OPENROUTER_EMBEDDING_MODEL: z
      .string()
      .min(1)
      .default('openai/text-embedding-ada-002'),

    S3_BUCKET: z.string().default('explainit'),
    S3_ENDPOINT: z.string().optional(),
    S3_PUBLIC_ENDPOINT: z.string().optional(),
    S3_FORCE_PATH_STYLE: booleanFromEnv,
    AWS_REGION: z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),

    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    HTTP_AUTH_USERNAME: optionalNonEmpty,
    HTTP_AUTH_PASSWORD: optionalNonEmpty,
    AUTH_SECRET: optionalNonEmpty,

    SCRAPER_PROVIDER: z.enum(['puppeteer', 'firecrawl']).default('puppeteer'),
    FIRECRAWL_API_KEY: optionalNonEmpty,
    FIRECRAWL_API_URL: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z.string().url().default('https://api.firecrawl.dev/v2'),
    ),

    DATABASE_URL: z.string().min(1),

    OTEL_SERVICE_NAME: z.string().default('explainit'),
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z
      .string()
      .url()
      .default('http://localhost:4318/v1/traces'),
  })
  .superRefine((env, ctx) => {
    if (
      passwordAuthEnabled(env) &&
      env.AUTH_SECRET &&
      env.AUTH_SECRET.length < 16
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_SECRET'],
        message:
          'AUTH_SECRET must be at least 16 characters when password auth is enabled',
      });
    }

    if (env.SCRAPER_PROVIDER === 'firecrawl' && !env.FIRECRAWL_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FIRECRAWL_API_KEY'],
        message:
          'FIRECRAWL_API_KEY is required when SCRAPER_PROVIDER is firecrawl',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function passwordAuthEnabled(
  env: Pick<Env, 'HTTP_AUTH_USERNAME' | 'HTTP_AUTH_PASSWORD'>,
): boolean {
  return Boolean(env.HTTP_AUTH_USERNAME && env.HTTP_AUTH_PASSWORD);
}

export function authMode(
  env: Pick<Env, 'HTTP_AUTH_USERNAME' | 'HTTP_AUTH_PASSWORD'>,
): 'none' | 'password' {
  return passwordAuthEnabled(env) ? 'password' : 'none';
}
