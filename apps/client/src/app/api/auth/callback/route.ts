import { NextRequest, NextResponse } from 'next/server';
import { safeReturnTo, TOKEN_COOKIE } from '@/lib/auth/config';
import { discoverIssuer } from '@/lib/auth/oidc';

function redirectUri() {
  return (
    process.env.AUTH_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000'}/api/auth/callback`
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const expectedState = req.cookies.get('explainit_oidc_state')?.value;
  const verifier = req.cookies.get('explainit_oidc_verifier')?.value;
  const returnTo = safeReturnTo(req.cookies.get('explainit_return_to')?.value);

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return NextResponse.redirect(new URL('/login?error=oidc', req.url));
  }

  const issuer = process.env.NEXT_PUBLIC_AUTH_ISSUER;
  const clientId = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID;
  if (!issuer || !clientId) {
    return NextResponse.redirect(new URL('/login?error=config', req.url));
  }

  const discovery = await discoverIssuer(issuer);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  });
  if (process.env.AUTH_CLIENT_SECRET) {
    body.set('client_secret', process.env.AUTH_CLIENT_SECRET);
  }

  const tokenRes = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/login?error=token', req.url));
  }

  const tokens = await tokenRes.json();
  const accessToken = tokens.id_token || tokens.access_token;
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login?error=token', req.url));
  }

  const res = NextResponse.redirect(new URL(returnTo, req.url));
  res.cookies.set({
    name: TOKEN_COOKIE,
    value: accessToken,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.delete('explainit_oidc_state');
  res.cookies.delete('explainit_oidc_verifier');
  res.cookies.delete('explainit_return_to');
  return res;
}
