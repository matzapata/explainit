import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { AuthController } from './auth.controller';
import { AuthService } from '@src/infra/auth/auth.service';

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
      ).toEqual({ access_token: 'jwt-token' });
    });

    it('rejects invalid credentials', () => {
      env.get.mockReturnValue('password');
      authService.login.mockReturnValue(null);

      expect(() =>
        controller.login({ email: 'admin@example.com', password: 'x' }),
      ).toThrow(UnauthorizedException);
    });
  });
});
