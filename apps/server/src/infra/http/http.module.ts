import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '@src/infra/auth/auth.module';
import { CrawlerModule } from '@src/infra/crawler/crawler.module';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { RateLimiterModule } from '@src/infra/rate-limiter/rate-limiter.module';
import { ObjectStorageModule } from '@src/infra/object-storage/object-storage.module';
import { ChatModule } from '@src/modules/chat/chat.module';
import { DocumentsModule } from '@src/modules/documents/documents.module';
import { UserModule } from '@src/modules/user/user.module';
import { AuthController } from './controllers/auth.controller';
import { ChatController } from './controllers/chat.controller';
import { DocumentsController } from './controllers/documents.controller';
import { HealthController } from './controllers/health.controller';
import { HostController } from './controllers/host.controller';
import { UsersController } from './controllers/users.controller';
import { RateLimiterGuard } from './guards/rate-limiter.guard';
import { CurrentUserMiddleware } from './middlewares/current-user.middleware';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ChatModule,
    DocumentsModule,
    ObjectStorageModule,
    CrawlerModule,
    PrismaModule,
    RateLimiterModule,
  ],
  controllers: [
    HealthController,
    AuthController,
    ChatController,
    HostController,
    DocumentsController,
    UsersController,
  ],
  providers: [
    CurrentUserMiddleware,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class HttpModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentUserMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'metrics', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
