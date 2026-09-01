// OpenTelemetry must initialize before Nest boots so auto-instrumentation can patch HTTP/Pino.
import tracingService from './observability/tracing';

import { NestFactory } from '@nestjs/core';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { EnvService } from './env/env.service';

function parseCorsOrigin(value: string): boolean | string | string[] {
  const trimmed = value.trim();
  if (trimmed === '*') {
    return true;
  }
  const origins = trimmed
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    return 'http://localhost:3000';
  }
  return origins.length === 1 ? origins[0] : origins;
}

async function bootstrap() {
  tracingService.start();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const env = app.get(EnvService);
  app.enableCors({
    origin: parseCorsOrigin(env.get('CORS_ORIGIN')),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  await app.listen(env.get('PORT'));
}

async function shutdown() {
  try {
    await tracingService.shutdown();
    console.log('Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap();
