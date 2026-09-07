// OpenTelemetry must initialize before Nest boots so auto-instrumentation can patch HTTP/Pino.
import tracingService from './observability/tracing';

import { NestFactory } from '@nestjs/core';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { EnvService } from './env/env.service';

async function bootstrap() {
  tracingService.start();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const env = app.get(EnvService);
  // Reflect any browser Origin so Host sites and custom UIs can call visitor
  // routes. Per-chat allowlisting happens in ChatController.
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.use((_req, res, next) => {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    next();
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
