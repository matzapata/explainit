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
    const decoded = jwt.verify(token, 'test-secret-at-least-16-chars') as jwt.JwtPayload;
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
});
