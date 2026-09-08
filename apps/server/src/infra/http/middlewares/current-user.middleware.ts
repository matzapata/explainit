import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { AuthService } from '@src/infra/auth/auth.service';
import type { EnvService } from '@src/infra/env/env.service';
import type { AuthUser } from '@src/modules/user/auth-user';
import type { UsersService } from '@src/modules/user/users.service';
import type { NextFunction, Request, Response } from 'express';

declare module 'express' {
  interface Request {
    currentUser: AuthUser | null;
  }
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private env: EnvService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const token = this.extractTokenFromHeader(req);
    const payload = await this.authService.verifyToken(token);

    if (payload) {
      const user = await this.usersService.findOrCreate(payload.email);
      req.currentUser = {
        id: user.id,
        email: user.email,
        isAdmin: payload.email === this.env.get('ADMIN_EMAIL'),
      };
    } else req.currentUser = null;

    next();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
