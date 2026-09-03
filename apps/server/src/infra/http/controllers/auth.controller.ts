import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { AuthService } from '@src/infra/auth/auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly env: EnvService,
  ) {}

  @Get('mode')
  mode() {
    return { mode: this.env.get('AUTH_MODE') };
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    const mode = this.env.get('AUTH_MODE');
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
