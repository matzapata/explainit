import type { JwtPayload } from './auth.provider';

export function payloadFromClaims(decoded: unknown): JwtPayload | null {
  if (!decoded || typeof decoded !== 'object') {
    return null;
  }

  const claims = decoded as Record<string, unknown>;
  const sub = claims.sub;
  const email = claims.email;

  if (typeof sub !== 'string' || typeof email !== 'string' || !email) {
    return null;
  }

  return { id: sub, email };
}
