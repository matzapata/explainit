import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@src/infra/auth/auth.service';
import { clientOrigin, safeReturnTo } from '@src/infra/auth/redirect';
import { EnvService } from '@src/infra/env/env.service';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly env: EnvService,
  ) {}

  @Get('mode')
  mode() {
    return { mode: this.env.authMode() };
  }

  @Get('login')
  startLogin(
    @Query('returnTo') returnToRaw: string | undefined,
    @Res() res: Response,
  ) {
    const returnTo = safeReturnTo(returnToRaw);
    const origin = clientOrigin(this.env.get('CORS_ORIGIN'));

    if (this.env.authMode() === 'none') {
      return res.redirect(`${origin}${returnTo}`);
    }

    return res.redirect(
      `${origin}/login?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }

  @Get('logout')
  logout(
    @Query('returnTo') returnToRaw: string | undefined,
    @Res() res: Response,
  ) {
    const origin = clientOrigin(this.env.get('CORS_ORIGIN'));
    return res.redirect(`${origin}${safeReturnTo(returnToRaw)}`);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    if (this.env.authMode() !== 'password') {
      throw new BadRequestException('Password login is disabled');
    }

    const accessToken = this.authService.login(body.username, body.password);
    if (!accessToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { access_token: accessToken, expires_in: TOKEN_MAX_AGE };
  }
}
