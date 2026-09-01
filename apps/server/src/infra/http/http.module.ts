import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from '@src/infra/auth/auth.module';
import { CrawlerModule } from '@src/infra/crawler/crawler.module';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { StorageModule } from '@src/infra/storage/storage.module';
import { ChatModule } from '@src/modules/chat/chat.module';
import { DocumentsModule } from '@src/modules/documents/documents.module';
import { UserModule } from '@src/modules/user/user.module';
import { HealthController } from './controllers/app/health.controller';
import { AuthController } from './controllers/auth/auth.controller';
import { ChatController } from './controllers/chat/chat.controller';
import { DocumentsController } from './controllers/documents/documents.controller';
import { UsersController } from './controllers/user/users.controller';
import { ChatMessagesRateLimit } from './guards/chat-messages-rate-limit.guard';
import { CurrentUserMiddleware } from './middlewares/current-user.middleware';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ChatModule,
    DocumentsModule,
    StorageModule,
    CrawlerModule,
    PrismaModule,
  ],
  controllers: [
    HealthController,
    AuthController,
    ChatController,
    DocumentsController,
    UsersController,
  ],
  providers: [
    CurrentUserMiddleware,
    ChatMessagesRateLimit,
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
