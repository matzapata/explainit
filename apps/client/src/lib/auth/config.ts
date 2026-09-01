export type AuthMode = 'none' | 'oidc' | 'password';

export const TOKEN_COOKIE = 'explainit_token';
export const NONE_ACCESS_TOKEN = 'none';

export function getAuthMode(): AuthMode {
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE ?? 'none';
  if (mode === 'oidc' || mode === 'password') {
    return mode;
  }
  return 'none';
}

export function safeReturnTo(
  value?: string | null,
  fallback = '/generate',
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}

export function loginHref(returnTo = '/generate'): string {
  const target = safeReturnTo(returnTo);
  if (getAuthMode() === 'none') {
    return target;
  }
  return `/login?returnTo=${encodeURIComponent(target)}`;
}
