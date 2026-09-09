import type { EnvService } from '@src/infra/env/env.service';
import { NoneProvider } from './none.provider';

describe('NoneProvider', () => {
  it('returns the configured username without a token', async () => {
    const config = {
      get: (key: string) =>
        key === 'HTTP_AUTH_USERNAME' ? 'admin' : undefined,
    } as unknown as EnvService;

    const provider = new NoneProvider(config);
    await expect(provider.verifyToken(undefined)).resolves.toEqual({
      id: 'local',
      email: 'admin',
    });
  });

  it('falls back to a local identity when username is unset', async () => {
    const config = {
      get: () => undefined,
    } as unknown as EnvService;

    const provider = new NoneProvider(config);
    await expect(provider.verifyToken(undefined)).resolves.toEqual({
      id: 'local',
      email: 'admin@localhost',
    });
  });
});
