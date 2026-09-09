import { Module } from '@nestjs/common';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UserModule {}
