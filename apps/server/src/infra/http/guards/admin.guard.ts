import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // requires a the current user middleware to be run first
    return !!req.currentUser && req.currentUser.isAdmin;
  }
}
