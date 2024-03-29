import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { AuthGuard } from 'src/users/guards/auth.guard';
import { UsersService } from './services/users.service';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dto/user-dto';
import { User } from '@prisma/client';

@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('/')
  @Serialize(UserDto)
  async update(@CurrentUser() user: User, @Body() data: UpdateUserDto) {
    const updated = await this.usersService.update(user.id, data.name);
    return updated;
  }

  @Get('/')
  async get(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
