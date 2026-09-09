import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { AuthService } from '@src/infra/auth/auth.service';
import type { EnvService } from '@src/infra/env/env.service';
import { AuthController } from './auth.controller';

function mockRes() {
  const res = {
    redirect: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const env = {
    get: jest.fn(),
    authMode: jest.fn(),
  } as unknown as jest.Mocked<EnvService>;

  const controller = new AuthController(authService, env);

  beforeEach(() => {
    jest.clearAllMocks();
    env.get.mockImplementation((key: string) => {
      if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
      return undefined;
    });
  });

  describe('mode', () => {
    it('returns none when password auth is not configured', () => {
      env.authMode.mockReturnValue('none');
      expect(controller.mode()).toEqual({ mode: 'none' });
    });

    it('returns password when username and password are set', () => {
      env.authMode.mockReturnValue('password');
      expect(controller.mode()).toEqual({ mode: 'password' });
    });
  });

  describe('login', () => {
    it('rejects login when password auth is not configured', () => {
      env.authMode.mockReturnValue('none');
      expect(() =>
        controller.login({ username: 'admin', password: 'x' }),
      ).toThrow(BadRequestException);
    });

    it('returns an access token for valid credentials', () => {
      env.authMode.mockReturnValue('password');
      authService.login.mockReturnValue('jwt-token');

      expect(controller.login({ username: 'admin', password: 'x' })).toEqual({
        access_token: 'jwt-token',
        expires_in: 60 * 60 * 24 * 7,
      });
    });

    it('rejects invalid credentials', () => {
      env.authMode.mockReturnValue('password');
      authService.login.mockReturnValue(null);

      expect(() =>
        controller.login({ username: 'admin', password: 'x' }),
      ).toThrow(UnauthorizedException);
    });
  });

  describe('startLogin', () => {
    it('redirects to the client when auth is not configured', () => {
      env.authMode.mockReturnValue('none');
      const res = mockRes();
      controller.startLogin('/settings', res as never);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/settings',
      );
    });

    it('redirects to the SPA login page when password auth is enabled', () => {
      env.authMode.mockReturnValue('password');
      const res = mockRes();
      controller.startLogin('/resources', res as never);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?returnTo=%2Fresources',
      );
    });
  });
});
