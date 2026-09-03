import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import Loading from '@/components/loading';
import { safeReturnTo, setAccessToken } from '@/lib/auth/config';

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: safeReturnTo(
      typeof search.returnTo === 'string' ? search.returnTo : undefined,
    ),
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { returnTo } = Route.useSearch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('token');
    if (!token) {
      window.location.replace('/login?error=token');
      return;
    }

    setAccessToken(token);
    window.location.replace(returnTo);
  }, [returnTo]);

  return <Loading />;
}
