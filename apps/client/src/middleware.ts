import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth/config';

const PROTECTED_PREFIXES = ['/generate', '/settings', '/onboarding'];

export function middleware(req: NextRequest) {
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'none';
  if (mode === 'none') {
    return NextResponse.next();
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !token) {
    const login = new URL('/login', req.url);
    login.searchParams.set('returnTo', req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/generate/:path*', '/settings/:path*', '/onboarding/:path*'],
};
