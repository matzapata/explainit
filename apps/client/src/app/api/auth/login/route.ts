import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthMode,
  safeReturnTo,
  TOKEN_COOKIE,
} from '@/lib/auth/config';
import { createPkce, createState, discoverIssuer } from '@/lib/auth/oidc';

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

function apiBase() {
  return (
    process.env.NEXT_PUBLIC_API_SERVER_BASE_URL ??
    process.env.NEXT_PUBLIC_API_CLIENT_BASE_URL ??
    'http://localhost:4000'
  );
}

function redirectUri() {
  return (
    process.env.AUTH_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000'}/api/auth/callback`
  );
}

export async function GET(req: NextRequest) {
  const mode = getAuthMode();
  const returnTo = safeReturnTo(req.nextUrl.searchParams.get('returnTo'));

  if (mode === 'none') {
    return NextResponse.redirect(new URL(returnTo, req.url));
  }

  if (mode === 'password') {
    return NextResponse.redirect(
      new URL(`/login?returnTo=${encodeURIComponent(returnTo)}`, req.url),
    );
  }

  const issuer = process.env.NEXT_PUBLIC_AUTH_ISSUER;
  const clientId = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID;
  if (!issuer || !clientId) {
    return NextResponse.json(
      { error: 'OIDC is not configured' },
      { status: 500 },
    );
  }

  const discovery = await discoverIssuer(issuer);
  const { verifier, challenge } = createPkce();
  const state = createState();
  const authorize = new URL(discovery.authorization_endpoint);
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri());
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', 'openid email profile');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');

  const res = NextResponse.redirect(authorize);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 10,
  };
  res.cookies.set('explainit_oidc_state', state, cookieOpts);
  res.cookies.set('explainit_oidc_verifier', verifier, cookieOpts);
  res.cookies.set('explainit_return_to', returnTo, cookieOpts);
  return res;
}

export async function POST(req: NextRequest) {
  if (getAuthMode() !== 'password') {
    return NextResponse.json(
      { error: 'Password login is disabled' },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;
  const returnTo = safeReturnTo(body?.returnTo);

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const apiRes = await fetch(`${apiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!apiRes.ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const data = await apiRes.json();
  const res = NextResponse.json({ ok: true, returnTo });
  res.cookies.set({
    name: TOKEN_COOKIE,
    value: data.access_token,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });
  return res;
}
