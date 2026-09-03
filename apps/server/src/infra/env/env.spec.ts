import { envSchema } from './env';

const base = {
  OPENROUTER_API_KEY: 'sk-test',
  ADMIN_EMAIL: 'admin@example.com',
  DATABASE_URL: 'postgres://localhost/explainit',
};

describe('envSchema', () => {
  it('accepts the default none auth mode', () => {
    const parsed = envSchema.parse(base);
    expect(parsed.AUTH_MODE).toBe('none');
    expect(parsed.OPENROUTER_BASE_URL).toBe('https://openrouter.ai/api/v1');
  });

  it('requires AUTH_JWKS_URI when AUTH_MODE is oidc', () => {
    const result = envSchema.safeParse({ ...base, AUTH_MODE: 'oidc' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['AUTH_JWKS_URI']);
    }
  });

  it('accepts oidc when a JWKS URI is set', () => {
    const parsed = envSchema.parse({
      ...base,
      AUTH_MODE: 'oidc',
      AUTH_JWKS_URI: 'https://issuer.example.com/.well-known/jwks.json',
    });
    expect(parsed.AUTH_MODE).toBe('oidc');
  });

  it('requires a long AUTH_SECRET and ADMIN_PASSWORD for password mode', () => {
    const missing = envSchema.safeParse({ ...base, AUTH_MODE: 'password' });
    expect(missing.success).toBe(false);

    const shortSecret = envSchema.safeParse({
      ...base,
      AUTH_MODE: 'password',
      AUTH_SECRET: 'too-short',
      ADMIN_PASSWORD: 'secret',
    });
    expect(shortSecret.success).toBe(false);

    const parsed = envSchema.parse({
      ...base,
      AUTH_MODE: 'password',
      AUTH_SECRET: 'test-secret-at-least-16-chars',
      ADMIN_PASSWORD: 'secret',
    });
    expect(parsed.AUTH_MODE).toBe('password');
  });

  it('parses boolean-like S3_FORCE_PATH_STYLE values', () => {
    expect(
      envSchema.parse({ ...base, S3_FORCE_PATH_STYLE: 'true' })
        .S3_FORCE_PATH_STYLE,
    ).toBe(true);
    expect(
      envSchema.parse({ ...base, S3_FORCE_PATH_STYLE: '0' })
        .S3_FORCE_PATH_STYLE,
    ).toBe(false);
  });
});
