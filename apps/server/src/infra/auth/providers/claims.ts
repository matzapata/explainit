import { JwtPayload } from './auth.provider';

export function emailFromClaims(
  decoded: Record<string, unknown>,
): string | undefined {
  const email =
    decoded.email ?? decoded.preferred_username ?? decoded['x-hasura-email'];

  return typeof email === 'string' && email.length > 0 ? email : undefined;
}

export function payloadFromClaims(decoded: unknown): JwtPayload | null {
  if (!decoded || typeof decoded !== 'object') {
    return null;
  }

  const claims = decoded as Record<string, unknown>;
  const sub = claims.sub;
  const email = emailFromClaims(claims);

  if (typeof sub !== 'string' || !email) {
    return null;
  }

  return { id: sub, email };
}
