import { Module } from '@nestjs/common';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { UsersRepository } from './application/repositories/users.repository';
import { UsersService } from './application/users.service';

@Module({
  providers: [UsersService, UsersRepository],
  imports: [PrismaModule],
  exports: [UsersService, UsersRepository],
})
export class UserModule {}
