import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('mode')
  mode() {
    return { mode: this.configService.get<string>('AUTH_MODE') ?? 'none' };
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    const mode = this.configService.get<string>('AUTH_MODE') ?? 'none';
    if (mode !== 'password') {
      throw new BadRequestException('Password login is disabled');
    }

    const accessToken = this.authService.login(body.email, body.password);
    if (!accessToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { access_token: accessToken };
  }
}
