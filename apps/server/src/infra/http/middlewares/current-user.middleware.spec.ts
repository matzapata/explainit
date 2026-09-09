import type { AuthService } from '@src/infra/auth/auth.service';
import type { UsersService } from '@src/modules/user/users.service';
import type { Request, Response } from 'express';
import { CurrentUserMiddleware } from './current-user.middleware';

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

  const middleware = new CurrentUserMiddleware(usersService, authService);

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('extracts a Bearer token', async () => {
    (authService.verifyToken as jest.Mock).mockResolvedValue({
      id: 'local',
      email: 'user@example.com',
    });
    (usersService.findOrCreate as jest.Mock).mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
    });

    const req = {
      headers: { authorization: 'Bearer jwt-token' },
    } as Request;
    await middleware.use(req, res, next);

    expect(authService.verifyToken).toHaveBeenCalledWith('jwt-token');
    expect(req.currentUser).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      isAdmin: true,
    });
  });
});
