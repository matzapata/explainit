import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const guard = new AuthGuard();

  const context = (currentUser: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ currentUser }),
      }),
    }) as never;

  it('allows requests with a current user', () => {
    expect(
      guard.canActivate(context({ id: '1', email: 'a@example.com' })),
    ).toBe(true);
  });

  it('rejects requests without a current user', () => {
    expect(guard.canActivate(context(null))).toBe(false);
    expect(guard.canActivate(context(undefined))).toBe(false);
  });
});
