import { NextRequest, NextResponse } from 'next/server';
import { safeReturnTo, TOKEN_COOKIE } from '@/lib/auth/config';

export async function GET(req: NextRequest) {
  const returnTo = safeReturnTo(
    req.nextUrl.searchParams.get('returnTo'),
    '/',
  );
  const res = NextResponse.redirect(new URL(returnTo, req.url));
  res.cookies.delete(TOKEN_COOKIE);
  return res;
}
