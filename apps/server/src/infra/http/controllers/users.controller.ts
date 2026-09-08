import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@src/infra/http/decorators/current-user.decorator';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { Serialize } from '@src/infra/http/interceptors/serialize.interceptor';
import type { AuthUser } from '@src/modules/user/auth-user';
import type { UsersService } from '@src/modules/user/users.service';
import type { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';

@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('/')
  @Serialize(UserDto)
  async update(@CurrentUser() user: AuthUser, @Body() data: UpdateUserDto) {
    const updated = await this.usersService.update(user.id, data.name);
    return updated;
  }

  @Get('/')
  async get(@CurrentUser() user: AuthUser) {
    const userData = await this.usersService.findById(user.id);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      isAdmin: user.isAdmin,
    };
  }
}
