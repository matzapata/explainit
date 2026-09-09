import { clientOrigin, safeReturnTo } from './redirect';

describe('auth redirect helpers', () => {
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
});
