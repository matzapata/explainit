import type { EnvService } from '@src/infra/env/env.service';
import * as jwt from 'jsonwebtoken';
import { JwksProvider } from './jwks.provider';

const getSigningKey = jest.fn();

jest.mock('jwks-rsa', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getSigningKey,
  })),
}));

jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
}));

describe('JwksProvider', () => {
  const env = {
    get: (key: string) =>
      ({
        AUTH_JWKS_URI: 'https://issuer.example.com/.well-known/jwks.json',
        AUTH_ISSUER: 'https://issuer.example.com',
        AUTH_AUDIENCE: 'explainit',
      })[key],
  } as unknown as EnvService;

  const provider = new JwksProvider(env);

  beforeEach(() => {
    jest.clearAllMocks();
    getSigningKey.mockImplementation((_kid, callback) => {
      callback(null, { getPublicKey: () => 'pem' });
    });
  });

  it('returns null without a token', async () => {
    await expect(provider.verifyToken(undefined)).resolves.toBeNull();
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('maps standard claims from a verified token', async () => {
    (jwt.verify as unknown as jest.Mock).mockImplementation(
      (_token, getKey, options, callback) => {
        expect(options).toMatchObject({
          issuer: 'https://issuer.example.com',
          audience: 'explainit',
        });
        getKey({ kid: 'k1' }, () => {
          callback(null, { sub: 'user-1', email: 'user@example.com' });
        });
      },
    );

    await expect(provider.verifyToken('header.payload.sig')).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
    });
    expect(getSigningKey).toHaveBeenCalledWith('k1', expect.any(Function));
  });

  it('returns null when verification fails', async () => {
    (jwt.verify as unknown as jest.Mock).mockImplementation(
      (_token, _getKey, _options, callback) => {
        callback(new Error('invalid signature'));
      },
    );

    await expect(provider.verifyToken('bad-token')).resolves.toBeNull();
  });
});
