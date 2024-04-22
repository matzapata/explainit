import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import { AuthService } from '../../infrastructure/auth/auth.service';

export interface AuthUser {
  id: string;
  email: string;
}

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
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractTokenFromHeader(req);
    const payload = await this.authService.verifyToken(token);

    if (payload) {
      let user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        user = await this.usersService.create(payload.email);
      }
      req.currentUser = { id: user.id, email: user.email };
    } else req.currentUser = null;

    next();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
