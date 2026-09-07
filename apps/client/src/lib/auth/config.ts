declare global {
  interface Window {
    /** Set when the Host widget is mounted on a customer page. */
    __EXPLAINIT_WIDGET__?: boolean;
    __EXPLAINIT_API_BASE__?: string;
    __EXPLAINIT_CHAT_ID__?: string;
    ExplainitWidget?: {
      mount: (
        shadowRoot: ShadowRoot,
        opts: {
          chatId: string;
          apiUrl: string;
          theme?: 'light' | 'dark' | 'system';
          onClose?: () => void;
        },
      ) => () => void;
    };
  }
}

export type AuthMode = 'none' | 'oidc' | 'password';

export const TOKEN_COOKIE = 'explainit_token';
export const NONE_ACCESS_TOKEN = 'none';
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

let cachedAuthMode: AuthMode | null = null;

export function apiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.__EXPLAINIT_API_BASE__ !== undefined) {
    return window.__EXPLAINIT_API_BASE__.replace(/\/$/, '');
  }
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw === undefined || raw === '') {
    return '';
  }
  return raw.replace(/\/$/, '');
}

export function getAuthMode(): AuthMode {
  return cachedAuthMode ?? 'none';
}

export function setAuthMode(mode: AuthMode) {
  cachedAuthMode = mode;
}

export async function fetchAuthMode(): Promise<AuthMode> {
  if (cachedAuthMode) {
    return cachedAuthMode;
  }

  const url = `${apiBaseUrl()}/api/auth/mode`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(
      `Could not reach the API at ${url || '/api/auth/mode'}. Is the server running?`,
    );
  }
  if (!res.ok) {
    throw new Error(`Failed to load auth mode (${res.status})`);
  }

  const data = (await res.json()) as { mode?: string };
  const mode =
    data.mode === 'oidc' || data.mode === 'password' ? data.mode : 'none';
  cachedAuthMode = mode;
  return mode;
}

export function safeReturnTo(
  value?: string | null,
  fallback = '/',
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}

export function readCookie(name: string): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const prefix = `${name}=`;
  const found = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : '';
}

export function getAccessToken(): string {
  if (typeof window !== 'undefined' && window.__EXPLAINIT_WIDGET__) {
    return '';
  }

  if (getAuthMode() === 'none') {
    return NONE_ACCESS_TOKEN;
  }

  return readCookie(TOKEN_COOKIE);
}

export function setAccessToken(token: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${TOKEN_MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearAccessToken() {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function loginHref(returnTo = '/'): string {
  const target = safeReturnTo(returnTo);
  const mode = getAuthMode();
  if (mode === 'none') {
    return target;
  }
  if (mode === 'oidc') {
    return `${apiBaseUrl()}/api/auth/login?returnTo=${encodeURIComponent(target)}`;
  }
  return `/login?returnTo=${encodeURIComponent(target)}`;
}

export function logoutHref(returnTo = '/'): string {
  const target = safeReturnTo(returnTo);
  if (getAuthMode() === 'oidc') {
    return `${apiBaseUrl()}/api/auth/logout?returnTo=${encodeURIComponent(target)}`;
  }
  return target;
}
