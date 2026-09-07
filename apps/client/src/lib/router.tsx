import { Link as RouterLink, useNavigate, useRouter as useTanstackRouter, useRouterState } from '@tanstack/react-router';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children?: ReactNode;
};

function isExternalHref(href: string) {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('#')
  );
}

export function Link({ href, children, className, ...rest }: AppLinkProps) {
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink
      to={href as never}
      className={className}
      activeOptions={{ exact: true }}
    >
      {children}
    </RouterLink>
  );
}

export function useRouter() {
  const navigate = useNavigate();
  const router = useTanstackRouter();

  return {
    push: (to: string) => navigate({ to: to as never }),
    back: () => router.history.back(),
  };
}

export function usePathname() {
  return useRouterState({ select: (state) => state.location.pathname });
}
