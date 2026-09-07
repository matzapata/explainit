import {
  normalizeHostOrigins,
  normalizePageUrl,
  originFromWebsiteUrl,
  parseDashboardOrigins,
  preferPageMatches,
  requestOrigin,
  visitorOriginAllowed,
} from './visitor-context';

describe('visitor-context', () => {
  describe('normalizePageUrl', () => {
    it('strips hash and trailing slash', () => {
      expect(normalizePageUrl('https://docs.example.com/guide/#section')).toBe(
        'https://docs.example.com/guide',
      );
      expect(normalizePageUrl('https://docs.example.com/guide/')).toBe(
        'https://docs.example.com/guide',
      );
    });

    it('returns null for empty or invalid', () => {
      expect(normalizePageUrl('')).toBeNull();
      expect(normalizePageUrl('not-a-url')).toBeNull();
    });
  });

  describe('originFromWebsiteUrl', () => {
    it('returns the origin', () => {
      expect(originFromWebsiteUrl('https://docs.example.com/path')).toBe(
        'https://docs.example.com',
      );
    });

    it('returns null when missing', () => {
      expect(originFromWebsiteUrl(null)).toBeNull();
    });
  });

  describe('normalizeHostOrigins', () => {
    it('stores origins and dedupes', () => {
      expect(
        normalizeHostOrigins([
          'https://www.demo.com/path',
          'https://docs.demo.com/',
          'https://demo.com/path',
          'https://www.demo.com',
        ]),
      ).toEqual([
        'https://www.demo.com',
        'https://docs.demo.com',
        'https://demo.com',
      ]);
    });

    it('rejects invalid URLs in strict mode', () => {
      expect(() =>
        normalizeHostOrigins(['not-a-url'], { strict: true }),
      ).toThrow(/Invalid host origin/);
      expect(() => normalizeHostOrigins(['*'], { strict: true })).toThrow(
        /valid http/,
      );
    });

    it('rejects more than 20 origins', () => {
      const many = Array.from(
        { length: 21 },
        (_, i) => `https://site-${i}.example.com`,
      );
      expect(() => normalizeHostOrigins(many)).toThrow(/At most 20/);
    });
  });

  describe('requestOrigin', () => {
    it('prefers Origin over Referer', () => {
      expect(
        requestOrigin('https://docs.example.com', 'https://other.example.com/x'),
      ).toBe('https://docs.example.com');
    });

    it('falls back to Referer origin', () => {
      expect(requestOrigin(undefined, 'https://docs.example.com/guide')).toBe(
        'https://docs.example.com',
      );
    });

    it('returns null when both are missing', () => {
      expect(requestOrigin(undefined, undefined)).toBeNull();
    });
  });

  describe('parseDashboardOrigins', () => {
    it('splits and trims CORS_ORIGIN', () => {
      expect(
        parseDashboardOrigins('http://localhost:3000, https://app.example.com/'),
      ).toEqual(['http://localhost:3000', 'https://app.example.com']);
    });

    it('returns empty for *', () => {
      expect(parseDashboardOrigins('*')).toEqual([]);
    });
  });

  describe('visitorOriginAllowed', () => {
    it('allows a Host origin from a path URL', () => {
      expect(
        visitorOriginAllowed('https://docs.example.com', [
          'https://docs.example.com/guide',
        ]),
      ).toBe(true);
    });

    it('allows any listed Host origin', () => {
      expect(
        visitorOriginAllowed('https://www.demo.com', [
          'https://demo.com',
          'https://www.demo.com/docs',
        ]),
      ).toBe(true);
    });

    it('allows dashboard CORS origins', () => {
      expect(
        visitorOriginAllowed('http://localhost:3000', ['https://docs.example.com'], {
          dashboardOrigins: ['http://localhost:3000'],
        }),
      ).toBe(true);
    });

    it('rejects unlisted localhost Host pages', () => {
      expect(
        visitorOriginAllowed('http://localhost:8080', ['https://clerk.com'], {
          dashboardOrigins: ['http://localhost:3000'],
        }),
      ).toBe(false);
      expect(
        visitorOriginAllowed('http://127.0.0.1:8080', ['https://clerk.com'], {
          dashboardOrigins: ['http://localhost:3000'],
        }),
      ).toBe(false);
    });

    it('rejects unknown origins', () => {
      expect(
        visitorOriginAllowed('https://evil.example.com', [
          'https://docs.example.com',
          'https://www.demo.com',
        ]),
      ).toBe(false);
      expect(visitorOriginAllowed(null, ['https://docs.example.com'])).toBe(
        false,
      );
    });
  });

  describe('preferPageMatches', () => {
    const hits = [
      { id: '1', metadata: { source: 'https://docs.example.com/a' } },
      { id: '2', metadata: { source: 'https://docs.example.com/b' } },
      { id: '3', metadata: { source: 'https://docs.example.com/a/' } },
      { id: '4', metadata: { source: 'https://other.example.com' } },
    ];

    it('puts matching page sources first and fills remaining slots', () => {
      expect(
        preferPageMatches(hits, 'https://docs.example.com/a#x', 3).map(
          (h) => h.id,
        ),
      ).toEqual(['1', '3', '2']);
    });

    it('returns original order when pageUrl is absent', () => {
      expect(preferPageMatches(hits, undefined, 2).map((h) => h.id)).toEqual([
        '1',
        '2',
      ]);
    });
  });
});
