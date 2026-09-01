import { payloadFromClaims } from './claims';

describe('payloadFromClaims', () => {
  it('reads standard sub and email', () => {
    expect(
      payloadFromClaims({ sub: 'user-1', email: 'a@example.com' }),
    ).toEqual({ id: 'user-1', email: 'a@example.com' });
  });

  it('falls back to preferred_username', () => {
    expect(
      payloadFromClaims({
        sub: 'user-1',
        preferred_username: 'a@example.com',
      }),
    ).toEqual({ id: 'user-1', email: 'a@example.com' });
  });

  it('falls back to x-hasura-email for existing Kinde tokens', () => {
    expect(
      payloadFromClaims({
        sub: 'user-1',
        'x-hasura-email': 'a@example.com',
      }),
    ).toEqual({ id: 'user-1', email: 'a@example.com' });
  });

  it('returns null without sub or email', () => {
    expect(payloadFromClaims({ email: 'a@example.com' })).toBeNull();
    expect(payloadFromClaims({ sub: 'user-1' })).toBeNull();
    expect(payloadFromClaims(null)).toBeNull();
  });
});
