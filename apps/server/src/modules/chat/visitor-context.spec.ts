import {
  CONVERSATION_COOKIE,
  frameAncestorsCsp,
  normalizePageUrl,
  originFromWebsiteUrl,
  parseCookieHeader,
  preferPageMatches,
  conversationCookieHeader,
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

  describe('frameAncestorsCsp', () => {
    it('is only the Website origin', () => {
      expect(frameAncestorsCsp('https://clerk.com')).toBe(
        'frame-ancestors https://clerk.com',
      );
    });

    it('also allows localhost Host pages in development', () => {
      expect(
        frameAncestorsCsp('https://clerk.com', { development: true }),
      ).toBe(
        'frame-ancestors https://clerk.com http://localhost:* http://127.0.0.1:*',
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

  describe('cookies', () => {
    it('parses a named cookie', () => {
      expect(
        parseCookieHeader(
          `a=1; ${CONVERSATION_COOKIE}=abc-123; b=2`,
          CONVERSATION_COOKIE,
        ),
      ).toBe('abc-123');
    });

    it('builds an httpOnly conversation cookie', () => {
      expect(conversationCookieHeader('conv-1')).toContain(
        `${CONVERSATION_COOKIE}=conv-1`,
      );
      expect(conversationCookieHeader('conv-1')).toContain('HttpOnly');
      expect(conversationCookieHeader('conv-1')).toContain('SameSite=None');
      expect(conversationCookieHeader('conv-1', { secure: false })).not.toContain(
        'Secure',
      );
    });
  });
});
