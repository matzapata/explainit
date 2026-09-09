import { CrawlerService } from './crawler.service';

describe('CrawlerService', () => {
  const service = new CrawlerService();

  describe('nextUrls', () => {
    it('resolves relative links against the page URL', () => {
      const urls = service.nextUrls({
        html: '<a href="/guide/install">Install</a><a href="setup">Setup</a>',
        pageUrl: 'https://docs.example.com/guide/',
        seedUrl: 'https://docs.example.com/guide/',
      });

      expect(urls).toEqual([
        'https://docs.example.com/guide/install',
        'https://docs.example.com/guide/setup',
      ]);
    });

    it('keeps only same-host links under the seed path', () => {
      const urls = service.nextUrls({
        html: `
          <a href="https://docs.example.com/guide/a">a</a>
          <a href="https://docs.example.com/blog/b">b</a>
          <a href="https://other.example.com/guide/c">c</a>
        `,
        pageUrl: 'https://docs.example.com/guide/',
        seedUrl: 'https://docs.example.com/guide',
      });

      expect(urls).toEqual(['https://docs.example.com/guide/a']);
    });

    it('allows the whole host when the seed path is /', () => {
      const urls = service.nextUrls({
        html: `
          <a href="https://docs.example.com/guide">guide</a>
          <a href="https://docs.example.com/blog">blog</a>
        `,
        pageUrl: 'https://docs.example.com/',
        seedUrl: 'https://docs.example.com/',
      });

      expect(urls).toEqual([
        'https://docs.example.com/guide',
        'https://docs.example.com/blog',
      ]);
    });

    it('strips hashes and lowercases the host', () => {
      const urls = service.nextUrls({
        html: '<a href="https://Docs.Example.com/guide/a#section">a</a>',
        pageUrl: 'https://docs.example.com/guide/',
        seedUrl: 'https://docs.example.com/guide/',
      });

      expect(urls).toEqual(['https://docs.example.com/guide/a']);
    });

    it('skips assets and non-http schemes', () => {
      const urls = service.nextUrls({
        html: `
          <a href="/guide/a.png">img</a>
          <a href="/guide/app.js">js</a>
          <a href="/guide/style.css">css</a>
          <a href="mailto:hi@example.com">mail</a>
          <a href="javascript:void(0)">js</a>
          <a href="/guide/ok">ok</a>
        `,
        pageUrl: 'https://docs.example.com/guide/',
        seedUrl: 'https://docs.example.com/guide/',
      });

      expect(urls).toEqual(['https://docs.example.com/guide/ok']);
    });

    it('dedupes identical links', () => {
      const urls = service.nextUrls({
        html: `
          <a href="/guide/a">one</a>
          <a href="https://docs.example.com/guide/a">two</a>
          <a href="/guide/a#x">three</a>
        `,
        pageUrl: 'https://docs.example.com/guide/',
        seedUrl: 'https://docs.example.com/guide/',
      });

      expect(urls).toEqual(['https://docs.example.com/guide/a']);
    });
  });
});
