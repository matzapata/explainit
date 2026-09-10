import { HttpScraperProvider } from './http.provider';

describe('HttpScraperProvider', () => {
  const provider = new HttpScraperProvider();
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('GETs the URL and returns HTML with the document title', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        '<html><head><title> Docs Home </title></head><body><a href="/guide">Guide</a></body></html>',
    });

    await expect(
      provider.scrape({ url: 'https://docs.example.com' }),
    ).resolves.toEqual({
      url: 'https://docs.example.com',
      title: 'Docs Home',
      html: '<html><head><title> Docs Home </title></head><body><a href="/guide">Guide</a></body></html>',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://docs.example.com',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('ExplainitBot'),
        }),
      }),
    );
  });

  it('throws on a non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    await expect(
      provider.scrape({ url: 'https://docs.example.com/missing' }),
    ).rejects.toThrow(
      'HTTP scrape failed (404) for https://docs.example.com/missing',
    );
  });
});
