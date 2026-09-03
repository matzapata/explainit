import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  const context = (currentUser: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ currentUser }),
      }),
    }) as never;

  it('allows an admin current user', () => {
    expect(
      guard.canActivate(
        context({ id: '1', email: 'admin@example.com', isAdmin: true }),
      ),
    ).toBe(true);
  });

  it('rejects a non-admin current user', () => {
    expect(
      guard.canActivate(
        context({ id: '1', email: 'user@example.com', isAdmin: false }),
      ),
    ).toBe(false);
  });

  it('rejects requests without a current user', () => {
    expect(guard.canActivate(context(null))).toBe(false);
  });
});
