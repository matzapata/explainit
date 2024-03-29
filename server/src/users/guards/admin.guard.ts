import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // requires a the current user middleware to be run first
    return (
      !!req.currentUser &&
      req.currentUser.id === this.configService.get('ADMIN_ID')
    );
  }
}
