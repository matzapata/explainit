import type { EnvService } from '@src/infra/env/env.service';
import { FirecrawlScraperProvider } from './firecrawl.provider';

describe('FirecrawlScraperProvider', () => {
  const env = {
    get: (key: string) =>
      ({
        FIRECRAWL_API_URL: 'https://api.firecrawl.dev/v2/',
        FIRECRAWL_API_KEY: 'fc-test',
      })[key],
  } as unknown as EnvService;

  const provider = new FirecrawlScraperProvider(env);
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('requests raw HTML so crawl can still extract links', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          rawHtml: '<html><a href="/guide">Guide</a></html>',
          metadata: { title: 'Docs' },
        },
      }),
    });

    await expect(
      provider.scrape({ url: 'https://docs.example.com' }),
    ).resolves.toEqual({
      url: 'https://docs.example.com',
      title: 'Docs',
      html: '<html><a href="/guide">Guide</a></html>',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.firecrawl.dev/v2/scrape',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer fc-test',
        }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      url: 'https://docs.example.com',
      formats: ['rawHtml'],
      onlyMainContent: false,
    });
  });

  it('uses the first metadata title when Firecrawl returns an array', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          rawHtml: '<p>hello</p>',
          metadata: { title: ['Guide', 'Docs'] },
        },
      }),
    });

    await expect(
      provider.scrape({ url: 'https://docs.example.com/guide' }),
    ).resolves.toEqual({
      url: 'https://docs.example.com/guide',
      title: 'Guide',
      html: '<p>hello</p>',
    });
  });

  it('throws the provider error message on a non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Request rate limit exceeded. Please wait and try again later.',
      }),
    });

    await expect(
      provider.scrape({ url: 'https://docs.example.com' }),
    ).rejects.toThrow(
      'Request rate limit exceeded. Please wait and try again later.',
    );
  });
});
