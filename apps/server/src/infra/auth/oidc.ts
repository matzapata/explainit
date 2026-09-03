import { createHash, randomBytes } from 'crypto';

export interface OidcDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
}

export function safeReturnTo(value?: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}

export function clientOrigin(corsOrigin: string): string {
  const trimmed = corsOrigin.trim();
  if (!trimmed || trimmed === '*') {
    return 'http://localhost:3000';
  }
  return trimmed.split(',')[0].trim().replace(/\/$/, '');
}

export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }

  return undefined;
}

export async function discoverIssuer(issuer: string): Promise<OidcDiscovery> {
  const url = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OIDC discovery failed for ${issuer}`);
  }
  return res.json();
}

export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function createState(): string {
  return randomBytes(16).toString('base64url');
}
