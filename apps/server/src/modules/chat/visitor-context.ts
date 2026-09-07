export const CONVERSATION_COOKIE = 'explainit_conversation';

export function parseCookieHeader(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) {
      const value = rest.join('=').trim();
      return value || undefined;
    }
  }
  return undefined;
}

export function conversationCookieHeader(
  conversationId: string,
  opts: { secure?: boolean } = {},
): string {
  const maxAge = 60 * 60 * 24 * 30;
  // Host Chat runs in a cross-site iframe, so the cookie must be SameSite=None.
  const secure = opts.secure ?? true;
  return `${CONVERSATION_COOKIE}=${conversationId}; Path=/; HttpOnly; SameSite=None${
    secure ? '; Secure' : ''
  }; Max-Age=${maxAge}`;
}

/** Normalize page URLs for comparing Embedding metadata.source. */
export function normalizePageUrl(
  url: string | undefined | null,
): string | null {
  if (!url?.trim()) {
    return null;
  }
  try {
    const parsed = new URL(url.trim());
    parsed.hash = '';
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    parsed.pathname = path || '/';
    return parsed.toString();
  } catch {
    return null;
  }
}

export function originFromWebsiteUrl(
  url: string | undefined | null,
): string | null {
  if (!url?.trim()) {
    return null;
  }
  try {
    return new URL(url.trim()).origin;
  } catch {
    return null;
  }
}

export function frameAncestorsCsp(
  allowedOrigin: string,
  opts: { development?: boolean } = {},
): string {
  if (!opts.development) {
    return `frame-ancestors ${allowedOrigin}`;
  }
  const extras = ['http://localhost:*', 'http://127.0.0.1:*'].filter(
    (origin) => origin !== allowedOrigin,
  );
  return `frame-ancestors ${[allowedOrigin, ...extras].join(' ')}`;
}

function metadataSource(metadata: unknown): string | null {
  if (
    metadata &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    'source' in metadata &&
    typeof (metadata as { source: unknown }).source === 'string'
  ) {
    return (metadata as { source: string }).source;
  }
  return null;
}

export function preferPageMatches<T extends { metadata?: unknown }>(
  hits: T[],
  pageUrl: string | undefined | null,
  k: number,
): T[] {
  const normalized = normalizePageUrl(pageUrl);
  if (!normalized) {
    return hits.slice(0, k);
  }

  const matching: T[] = [];
  const rest: T[] = [];
  for (const hit of hits) {
    const source = normalizePageUrl(metadataSource(hit.metadata));
    if (source && source === normalized) {
      matching.push(hit);
    } else {
      rest.push(hit);
    }
  }

  return [...matching, ...rest].slice(0, k);
}
