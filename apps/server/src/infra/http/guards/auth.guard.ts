import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // requires a the current user middleware to be run first
    return !!req.currentUser;
  }
}
