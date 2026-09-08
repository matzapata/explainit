import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { AuthService } from '@src/infra/auth/auth.service';
import type { EnvService } from '@src/infra/env/env.service';
import { AuthController } from './auth.controller';

function mockRes() {
  const res = {
    redirect: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const env = {
    get: jest.fn(),
  } as unknown as jest.Mocked<EnvService>;

  const controller = new AuthController(authService, env);

  beforeEach(() => {
    jest.clearAllMocks();
    env.get.mockImplementation((key: string) => {
      if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return 'test';
      return undefined;
    });
  });

  describe('mode', () => {
    it('returns the configured auth mode', () => {
      env.get.mockReturnValue('none');
      expect(controller.mode()).toEqual({ mode: 'none' });
    });
  });

  describe('login', () => {
    it('rejects login when AUTH_MODE is not password', () => {
      env.get.mockReturnValue('none');
      expect(() =>
        controller.login({ email: 'admin@example.com', password: 'x' }),
      ).toThrow(BadRequestException);
    });

    it('returns an access token for valid credentials', () => {
      env.get.mockReturnValue('password');
      authService.login.mockReturnValue('jwt-token');

      expect(
        controller.login({ email: 'admin@example.com', password: 'x' }),
      ).toEqual({ access_token: 'jwt-token', expires_in: 60 * 60 * 24 * 7 });
    });

    it('rejects invalid credentials', () => {
      env.get.mockReturnValue('password');
      authService.login.mockReturnValue(null);

      expect(() =>
        controller.login({ email: 'admin@example.com', password: 'x' }),
      ).toThrow(UnauthorizedException);
    });
  });

  describe('startLogin', () => {
    it('redirects to the client when AUTH_MODE is none', async () => {
      env.get.mockImplementation((key: string) => {
        if (key === 'AUTH_MODE') return 'none';
        if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
        return undefined;
      });
      const res = mockRes();
      await controller.startLogin('/settings', res as never);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/settings',
      );
    });

    it('redirects to the SPA login page in password mode', async () => {
      env.get.mockImplementation((key: string) => {
        if (key === 'AUTH_MODE') return 'password';
        if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
        return undefined;
      });
      const res = mockRes();
      await controller.startLogin('/resources', res as never);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?returnTo=%2Fresources',
      );
    });
  });
});
