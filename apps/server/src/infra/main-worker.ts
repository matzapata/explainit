import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import tracingService from './observability/tracing';
import { WorkerModule } from './worker.module';

let app: INestApplicationContext | undefined;

async function bootstrap() {
  tracingService.start();

  app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
}

async function shutdown() {
  try {
    await app?.close();
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
