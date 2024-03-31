import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../middlewares/current-user.middleware';

export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest();
    return request.currentUser;
  },
);
