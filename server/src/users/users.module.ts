import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { AuthService } from '../infrastructure/auth/auth.service';
import { CurrentUserMiddleware } from './middlewares/current-user.middleware';
import { UsersRepository } from './repositories/users.repository';
import { PrismaModule } from 'src/database/prisma.module';

@Module({
  providers: [UsersService, AuthService, UsersRepository],
  imports: [PrismaModule],
  controllers: [UsersController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*');
  }
}
