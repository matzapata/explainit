import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '@src/modules/user/users.service';
import { AuthService } from '@src/infra/auth/auth.service';
import { EnvService } from '@src/infra/env/env.service';
import { AuthUser } from '@src/modules/user/auth-user';

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

  async use(req: Request, res: Response, next: NextFunction) {
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
