'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { loginHref } from './config';

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
  const returnTo = postLogoutRedirectURL ?? '/';
  return (
    <Link
      href={`/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`}
      className={className}
    >
      {children}
    </Link>
  );
}
