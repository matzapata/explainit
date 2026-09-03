import { Module } from '@nestjs/common';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, UsersRepository],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UserModule {}
