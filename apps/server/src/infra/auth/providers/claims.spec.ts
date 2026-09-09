import { payloadFromClaims } from './claims';

describe('payloadFromClaims', () => {
  it('reads sub and email', () => {
    expect(payloadFromClaims({ sub: 'user-1', email: 'admin' })).toEqual({
      id: 'user-1',
      email: 'admin',
    });
  });

  it('returns null without sub or email', () => {
    expect(payloadFromClaims({ email: 'admin' })).toBeNull();
    expect(payloadFromClaims({ sub: 'user-1' })).toBeNull();
    expect(payloadFromClaims(null)).toBeNull();
  });
});
