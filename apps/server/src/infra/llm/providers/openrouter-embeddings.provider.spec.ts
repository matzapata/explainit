import { EnvService } from '@src/infra/env/env.service';
import { OpenRouterEmbeddingsProvider } from './openrouter-embeddings.provider';

describe('OpenRouterEmbeddingsProvider', () => {
  const env = {
    get: (key: string) =>
      ({
        OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1/',
        OPENROUTER_API_KEY: 'sk-test',
        OPENROUTER_EMBEDDING_MODEL: 'openai/text-embedding-ada-002',
      })[key],
  } as unknown as EnvService;

  const provider = new OpenRouterEmbeddingsProvider(env);
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('normalizes newlines and posts to /embeddings', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2] }] }),
    });

    await expect(provider.generateEmbeddings('hello\nworld')).resolves.toEqual([
      0.1, 0.2,
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      model: 'openai/text-embedding-ada-002',
      input: 'hello world',
    });
  });

  it('throws the provider error message on a non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: { message: 'upstream down' } }),
    });

    await expect(provider.generateEmbeddings('hello')).rejects.toThrow(
      'upstream down',
    );
  });

  it('throws when the response has no vector', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [] }] }),
    });

    await expect(provider.generateEmbeddings('hello')).rejects.toThrow(
      'OpenRouter embeddings response had no vector',
    );
  });
});
