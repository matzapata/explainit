import type { ReactNode } from 'react';
import { Link } from '@/lib/router';
import { clearAccessToken, loginHref, logoutHref } from './config';

interface AuthLinkProps {
  children: ReactNode;
  className?: string;
  postLoginRedirectURL?: string;
  postLogoutRedirectURL?: string;
}

export function LoginLink({
  children,
  className,
  postLoginRedirectURL,
}: AuthLinkProps) {
  return (
    <Link href={loginHref(postLoginRedirectURL)} className={className}>
      {children}
    </Link>
  );
}

export const RegisterLink = LoginLink;

export function LogoutLink({
  children,
  className,
  postLogoutRedirectURL,
}: AuthLinkProps) {
  const href = logoutHref(postLogoutRedirectURL ?? '/');

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        clearAccessToken();
      }}
    >
      {children}
    </a>
  );
}
