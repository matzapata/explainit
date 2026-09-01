import { redirect } from 'next/navigation';
import { getAuthMode, isAuthenticated, safeReturnTo } from '@/lib/auth/session';
import { LoginForm } from './login-form';
import Logo from '@/components/brand/logo';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { returnTo?: string; error?: string };
}) {
  const mode = getAuthMode();
  const returnTo = safeReturnTo(searchParams.returnTo);

  if (mode === 'none') {
    redirect(returnTo);
  }

  if (await isAuthenticated()) {
    redirect(returnTo);
  }

  if (mode === 'oidc') {
    redirect(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Use the admin email and password from your server env.
          </p>
        </div>
        {searchParams.error ? (
          <p className="text-sm text-center text-red-500">
            Sign in failed. Check your identity provider configuration.
          </p>
        ) : null}
        <LoginForm returnTo={returnTo} />
      </div>
    </main>
  );
}
