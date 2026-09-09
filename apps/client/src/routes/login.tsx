import { createFileRoute, redirect } from '@tanstack/react-router';
import Logo from '@/components/brand/logo';
import { LoginForm } from '@/components/login-form';
import { getAccessToken, safeReturnTo } from '@/lib/auth/config';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: safeReturnTo(
      typeof search.returnTo === 'string' ? search.returnTo : undefined,
    ),
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    const returnTo = search.returnTo ?? '/';
    if (context.authMode === 'none' || getAccessToken()) {
      throw redirect({ to: returnTo as never });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { returnTo, error } = Route.useSearch();

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sign in
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use the username and password from your server env.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-center text-red-500">
            Sign in failed. Check your username and password.
          </p>
        ) : null}
        <LoginForm returnTo={returnTo} />
      </div>
    </main>
  );
}
