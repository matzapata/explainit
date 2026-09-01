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

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('production'),
    PORT: z.coerce.number().default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    OPENAI_API_KEY: z.string().min(1),
    OPENAI_BASE_URL: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z.string().url().optional(),
    ),
    OPENAI_MODEL: z.string().min(1).default('gpt-3.5-turbo-0125'),
    OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-ada-002'),

    S3_BUCKET: z.string().default('explainit'),
    S3_ENDPOINT: z.string().optional(),
    S3_PUBLIC_ENDPOINT: z.string().optional(),
    S3_FORCE_PATH_STYLE: booleanFromEnv,
    AWS_REGION: z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),

    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    AUTH_MODE: z.enum(['none', 'oidc', 'password']).default('none'),
    ADMIN_EMAIL: z.string().min(1),
    AUTH_JWKS_URI: z.string().url().optional(),
    AUTH_ISSUER: z.string().optional(),
    AUTH_AUDIENCE: z.string().optional(),
    AUTH_SECRET: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),

    DATABASE_URL: z.string().min(1),

    OTEL_SERVICE_NAME: z.string().default('explainit'),
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z
      .string()
      .url()
      .default('http://localhost:4318/v1/traces'),
  })
  .superRefine((env, ctx) => {
    if (env.AUTH_MODE === 'oidc' && !env.AUTH_JWKS_URI) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_JWKS_URI'],
        message: 'AUTH_JWKS_URI is required when AUTH_MODE=oidc',
      });
    }

    if (env.AUTH_MODE === 'password') {
      if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AUTH_SECRET'],
          message:
            'AUTH_SECRET must be at least 16 characters when AUTH_MODE=password',
        });
      }
      if (!env.ADMIN_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ADMIN_PASSWORD'],
          message: 'ADMIN_PASSWORD is required when AUTH_MODE=password',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;
