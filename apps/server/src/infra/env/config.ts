import type { ConfigModuleOptions } from '@nestjs/config';
import { envSchema } from './env';

export function envConfig(): ConfigModuleOptions {
  return {
    isGlobal: true,
    envFilePath: '.env',
    ignoreEnvFile: process.env.NODE_ENV !== 'development',
    validate: (env) => envSchema.parse(env),
  };
}
