import { EnvService } from '@src/infra/env/env.service';
import * as jwt from 'jsonwebtoken';
import { PasswordProvider } from './password.provider';

describe('PasswordProvider', () => {
  const config = {
    get: (key: string) =>
      ({
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'secret',
        AUTH_SECRET: 'test-secret-at-least-16-chars',
      })[key],
  } as unknown as EnvService;

  const provider = new PasswordProvider(config);

  it('issues a JWT for the bootstrap admin', () => {
    const token = provider.login('admin@example.com', 'secret');
    expect(token).toBeTruthy();
    const decoded = jwt.verify(
      token,
      'test-secret-at-least-16-chars',
    ) as jwt.JwtPayload;
    expect(decoded.sub).toBe('local');
    expect(decoded.email).toBe('admin@example.com');
  });

  it('rejects the wrong password', () => {
    expect(provider.login('admin@example.com', 'nope')).toBeNull();
  });

  it('verifies a token it issued', async () => {
    const token = provider.login('admin@example.com', 'secret');
    await expect(provider.verifyToken(token)).resolves.toEqual({
      id: 'local',
      email: 'admin@example.com',
    });
  });

  it('rejects a missing token', async () => {
    await expect(provider.verifyToken(undefined)).resolves.toBeNull();
  });

  it('rejects the wrong email', () => {
    expect(provider.login('other@example.com', 'secret')).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = provider.login('admin@example.com', 'secret');
    await expect(provider.verifyToken(`${token}x`)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = jwt.sign(
      { sub: 'local', email: 'admin@example.com' },
      'test-secret-at-least-16-chars',
      { algorithm: 'HS256', expiresIn: -1 },
    );

    await expect(provider.verifyToken(token)).resolves.toBeNull();
  });
});
