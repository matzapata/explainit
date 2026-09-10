import { authMode, envSchema, passwordAuthEnabled } from './env';

const base = {
  OPENROUTER_API_KEY: 'sk-test',
  DATABASE_URL: 'postgres://localhost/explainit',
};

describe('envSchema', () => {
  it('accepts an unsecured instance when username and password are unset', () => {
    const parsed = envSchema.parse(base);
    expect(parsed.HTTP_AUTH_USERNAME).toBeUndefined();
    expect(parsed.HTTP_AUTH_PASSWORD).toBeUndefined();
    expect(parsed.OPENROUTER_BASE_URL).toBe('https://openrouter.ai/api/v1');
    expect(authMode(parsed)).toBe('none');
  });

  it('treats empty auth credentials as unset', () => {
    const parsed = envSchema.parse({
      ...base,
      HTTP_AUTH_USERNAME: '',
      HTTP_AUTH_PASSWORD: '  ',
    });
    expect(passwordAuthEnabled(parsed)).toBe(false);
  });

  it('does not enable password auth when only one credential is set', () => {
    expect(
      passwordAuthEnabled(
        envSchema.parse({ ...base, HTTP_AUTH_USERNAME: 'admin' }),
      ),
    ).toBe(false);
    expect(
      passwordAuthEnabled(
        envSchema.parse({ ...base, HTTP_AUTH_PASSWORD: 'secret' }),
      ),
    ).toBe(false);
  });

  it('enables password auth when username and password are set', () => {
    const parsed = envSchema.parse({
      ...base,
      HTTP_AUTH_USERNAME: 'admin',
      HTTP_AUTH_PASSWORD: 'secret',
    });
    expect(authMode(parsed)).toBe('password');
  });

  it('rejects a short AUTH_SECRET when password auth is enabled', () => {
    const result = envSchema.safeParse({
      ...base,
      HTTP_AUTH_USERNAME: 'admin',
      HTTP_AUTH_PASSWORD: 'secret',
      AUTH_SECRET: 'too-short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['AUTH_SECRET']);
    }
  });

  it('accepts a long AUTH_SECRET with password auth', () => {
    const parsed = envSchema.parse({
      ...base,
      HTTP_AUTH_USERNAME: 'admin',
      HTTP_AUTH_PASSWORD: 'secret',
      AUTH_SECRET: 'test-secret-at-least-16-chars',
    });
    expect(authMode(parsed)).toBe('password');
    expect(parsed.AUTH_SECRET).toBe('test-secret-at-least-16-chars');
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

  it('defaults the scraper to http', () => {
    const parsed = envSchema.parse(base);
    expect(parsed.SCRAPER_PROVIDER).toBe('http');
    expect(parsed.FIRECRAWL_API_URL).toBe('https://api.firecrawl.dev/v2');
  });

  it('rejects firecrawl without an API key', () => {
    const result = envSchema.safeParse({
      ...base,
      SCRAPER_PROVIDER: 'firecrawl',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['FIRECRAWL_API_KEY']);
    }
  });

  it('accepts firecrawl when an API key is set', () => {
    const parsed = envSchema.parse({
      ...base,
      SCRAPER_PROVIDER: 'firecrawl',
      FIRECRAWL_API_KEY: 'fc-test',
    });
    expect(parsed.SCRAPER_PROVIDER).toBe('firecrawl');
    expect(parsed.FIRECRAWL_API_KEY).toBe('fc-test');
  });

  it('rejects unknown scraper providers', () => {
    for (const provider of ['obscura', 'puppeteer']) {
      const result = envSchema.safeParse({
        ...base,
        SCRAPER_PROVIDER: provider,
      });
      expect(result.success).toBe(false);
    }
  });
});
