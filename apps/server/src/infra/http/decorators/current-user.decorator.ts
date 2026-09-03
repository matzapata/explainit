import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@src/modules/user/auth-user';

export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest();
    return request.currentUser;
  },
);
