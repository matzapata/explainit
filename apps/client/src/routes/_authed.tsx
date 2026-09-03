import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getAccessToken } from '@/lib/auth/config';

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context, location }) => {
    if (context.authMode !== 'none' && !getAccessToken()) {
      throw redirect({
        to: '/login',
        search: { returnTo: location.pathname },
      });
    }
  },
  component: () => <Outlet />,
});
