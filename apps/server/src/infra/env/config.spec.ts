import { envConfig } from './config';

describe('envConfig', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('loads .env only in development', () => {
    process.env.NODE_ENV = 'development';
    expect(envConfig().ignoreEnvFile).toBe(false);
  });

  it('uses process env in production so ECS-injected secrets apply on restart', () => {
    process.env.NODE_ENV = 'production';
    expect(envConfig().ignoreEnvFile).toBe(true);
  });

  it('does not load .env during tests', () => {
    process.env.NODE_ENV = 'test';
    expect(envConfig().ignoreEnvFile).toBe(true);
  });
});
