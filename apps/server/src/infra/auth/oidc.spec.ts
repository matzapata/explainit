import { clientOrigin, readCookie, safeReturnTo } from './oidc';

describe('oidc helpers', () => {
  describe('safeReturnTo', () => {
    it('rejects absolute and protocol-relative URLs', () => {
      expect(safeReturnTo('https://evil.example')).toBe('/');
      expect(safeReturnTo('//evil.example')).toBe('/');
      expect(safeReturnTo('/settings')).toBe('/settings');
    });
  });

  describe('clientOrigin', () => {
    it('uses the first CORS origin', () => {
      expect(clientOrigin('http://localhost:3000')).toBe(
        'http://localhost:3000',
      );
      expect(
        clientOrigin('http://localhost:3000,https://app.example.com'),
      ).toBe('http://localhost:3000');
      expect(clientOrigin('*')).toBe('http://localhost:3000');
    });
  });

  describe('readCookie', () => {
    it('reads a named cookie from the header', () => {
      expect(
        readCookie('a=1; explainit_oidc_state=abc', 'explainit_oidc_state'),
      ).toBe('abc');
      expect(readCookie(undefined, 'a')).toBeUndefined();
    });
  });
});
