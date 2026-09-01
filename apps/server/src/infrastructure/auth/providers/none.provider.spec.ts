import { ConfigService } from '@nestjs/config';
import { NoneProvider } from './none.provider';

describe('NoneProvider', () => {
  it('returns the bootstrap admin without a token', async () => {
    const config = {
      get: (key: string) => (key === 'ADMIN_EMAIL' ? 'admin@example.com' : undefined),
    } as unknown as ConfigService;

    const provider = new NoneProvider(config);
    await expect(provider.verifyToken(undefined)).resolves.toEqual({
      id: 'local',
      email: 'admin@example.com',
    });
  });
});
