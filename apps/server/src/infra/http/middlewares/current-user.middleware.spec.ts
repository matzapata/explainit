import { CurrentUserMiddleware } from './current-user.middleware';
import { UsersService } from '@src/modules/user/users.service';
import { AuthService } from '@src/infra/auth/auth.service';
import { EnvService } from '@src/infra/env/env.service';
import { Request, Response } from 'express';

describe('CurrentUserMiddleware', () => {
  const next = jest.fn();
  const res = {} as Response;

  const usersService = {
    findOrCreate: jest.fn().mockResolvedValue({
      id: 'db-id',
      email: 'admin@example.com',
    }),
  } as unknown as UsersService;

  const authService = {
    verifyToken: jest.fn(),
  } as unknown as AuthService;

  const env = {
    get: jest.fn().mockReturnValue('admin@example.com'),
  } as unknown as EnvService;

  const middleware = new CurrentUserMiddleware(usersService, authService, env);

  beforeEach(() => {
    jest.clearAllMocks();
    (env.get as jest.Mock).mockReturnValue('admin@example.com');
    (usersService.findOrCreate as jest.Mock).mockResolvedValue({
      id: 'db-id',
      email: 'admin@example.com',
    });
  });

  it('attaches the bootstrap user when verifyToken succeeds without a header', async () => {
    (authService.verifyToken as jest.Mock).mockResolvedValue({
      id: 'local',
      email: 'admin@example.com',
    });

    const req = { headers: {} } as Request;
    await middleware.use(req, res, next);

    expect(authService.verifyToken).toHaveBeenCalledWith(undefined);
    expect(usersService.findOrCreate).toHaveBeenCalledWith('admin@example.com');
    expect(req.currentUser).toEqual({
      id: 'db-id',
      email: 'admin@example.com',
      isAdmin: true,
    });
    expect(next).toHaveBeenCalled();
  });

  it('leaves currentUser null when verification fails', async () => {
    (authService.verifyToken as jest.Mock).mockResolvedValue(null);

    const req = { headers: {} } as Request;
    await middleware.use(req, res, next);

    expect(req.currentUser).toBeNull();
  });
});
