import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  const controller = new AuthController(authService, configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mode', () => {
    it('returns the configured auth mode', () => {
      configService.get.mockReturnValue('none');
      expect(controller.mode()).toEqual({ mode: 'none' });
    });
  });

  describe('login', () => {
    it('rejects login when AUTH_MODE is not password', () => {
      configService.get.mockReturnValue('none');
      expect(() =>
        controller.login({ email: 'admin@example.com', password: 'x' }),
      ).toThrow(BadRequestException);
    });

    it('returns an access token for valid credentials', () => {
      configService.get.mockReturnValue('password');
      authService.login.mockReturnValue('jwt-token');

      expect(
        controller.login({ email: 'admin@example.com', password: 'x' }),
      ).toEqual({ access_token: 'jwt-token' });
    });

    it('rejects invalid credentials', () => {
      configService.get.mockReturnValue('password');
      authService.login.mockReturnValue(null);

      expect(() =>
        controller.login({ email: 'admin@example.com', password: 'x' }),
      ).toThrow(UnauthorizedException);
    });
  });
});
