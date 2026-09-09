import type { EnvService } from '@src/infra/env/env.service';
import * as jwt from 'jsonwebtoken';
import { PasswordProvider } from './password.provider';

describe('PasswordProvider', () => {
  const config = {
    get: (key: string) =>
      ({
        HTTP_AUTH_USERNAME: 'admin',
        HTTP_AUTH_PASSWORD: 'secret',
        AUTH_SECRET: 'test-secret-at-least-16-chars',
      })[key],
  } as unknown as EnvService;

  const provider = new PasswordProvider(config);

  it('issues a JWT for the configured user', () => {
    const token = provider.login('admin', 'secret');
    expect(token).toBeTruthy();
    const decoded = jwt.verify(
      token,
      'test-secret-at-least-16-chars',
    ) as jwt.JwtPayload;
    expect(decoded.sub).toBe('local');
    expect(decoded.email).toBe('admin');
  });

  it('rejects the wrong password', () => {
    expect(provider.login('admin', 'nope')).toBeNull();
  });

  it('verifies a token it issued', async () => {
    const token = provider.login('admin', 'secret');
    await expect(provider.verifyToken(token)).resolves.toEqual({
      id: 'local',
      email: 'admin',
    });
  });

  it('rejects a missing token', async () => {
    await expect(provider.verifyToken(undefined)).resolves.toBeNull();
  });

  it('rejects the wrong username', () => {
    expect(provider.login('other', 'secret')).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = provider.login('admin', 'secret');
    await expect(provider.verifyToken(`${token}x`)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = jwt.sign(
      { sub: 'local', email: 'admin' },
      'test-secret-at-least-16-chars',
      { algorithm: 'HS256', expiresIn: -1 },
    );

    await expect(provider.verifyToken(token)).resolves.toBeNull();
  });

  it('derives a JWT secret from the password when AUTH_SECRET is unset', async () => {
    const derived = new PasswordProvider({
      get: (key: string) =>
        ({
          HTTP_AUTH_USERNAME: 'admin',
          HTTP_AUTH_PASSWORD: 'secret',
        })[key],
    } as unknown as EnvService);

    const token = derived.login('admin', 'secret');
    expect(token).toBeTruthy();
    await expect(derived.verifyToken(token)).resolves.toEqual({
      id: 'local',
      email: 'admin',
    });
  });
});
