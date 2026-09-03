import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth/use-session';
import {
  fetchAuthMode,
  getAccessToken,
  type AuthMode,
} from '@/lib/auth/config';
import NotFound from '@/components/not-found';
import Loading from '@/components/loading';

export interface RouterContext {
  queryClient: QueryClient;
  authMode: AuthMode;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const authMode = await fetchAuthMode();
    return { authMode };
  },
  pendingComponent: Loading,
  notFoundComponent: NotFound,
  errorComponent: RootError,
  component: RootLayout,
});

function RootError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 space-y-2">
      <p className="text-sm text-gray-300">Could not load Explainit.</p>
      <p className="text-sm text-gray-500 max-w-lg text-center">{error.message}</p>
    </div>
  );
}

function RootLayout() {
  const { authMode, queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider accessToken={getAccessToken()} mode={authMode}>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
