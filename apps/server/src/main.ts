import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

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
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableCors({
    origin: parseCorsOrigin(
      config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000',
    ),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  await app.listen(parseInt(process.env.PORT) || 4000);
}
bootstrap();
