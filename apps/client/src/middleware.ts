import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth/config';

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/') {
    return true;
  }

  return ['/resources', '/settings', '/onboarding'].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(req: NextRequest) {
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'none';
  if (mode === 'none') {
    return NextResponse.next();
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  if (isProtectedPath(req.nextUrl.pathname) && !token) {
    const login = new URL('/login', req.url);
    login.searchParams.set('returnTo', req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/resources/:path*', '/settings/:path*', '/onboarding/:path*'],
};
