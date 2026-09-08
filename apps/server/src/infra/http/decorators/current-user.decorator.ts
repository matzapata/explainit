import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@src/modules/user/auth-user';

export const CurrentUser = createParamDecorator(
  (_data: never, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest();
    return request.currentUser;
  },
);
