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

/** Prefer Origin; fall back to Referer origin for same-origin navigations. */
export function requestOrigin(
  originHeader: string | undefined,
  refererHeader: string | undefined,
): string | null {
  if (originHeader?.trim()) {
    try {
      return new URL(originHeader.trim()).origin;
    } catch {
      // fall through to Referer
    }
  }
  if (refererHeader?.trim()) {
    try {
      return new URL(refererHeader.trim()).origin;
    } catch {
      return null;
    }
  }
  return null;
}

export function parseDashboardOrigins(corsOrigin: string): string[] {
  const trimmed = corsOrigin.trim();
  if (!trimmed || trimmed === '*') {
    return [];
  }
  return trimmed
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export const MAX_HOST_ORIGINS = 20;

/**
 * Canonicalize Host URLs to origins for storage.
 * Drops duplicates. When `strict`, rejects `*`, empty, and invalid URLs.
 */
export function normalizeHostOrigins(
  values: string[] | undefined | null,
  opts: { strict?: boolean } = {},
): string[] {
  if (!values?.length) {
    return [];
  }

  if (values.length > MAX_HOST_ORIGINS) {
    throw new Error(`At most ${MAX_HOST_ORIGINS} host origins are allowed`);
  }

  const seen = new Set<string>();
  const origins: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed || trimmed === '*') {
      if (opts.strict) {
        throw new Error('Host origins must be valid http(s) URLs');
      }
      continue;
    }
    const origin = originFromWebsiteUrl(trimmed);
    if (!origin) {
      if (opts.strict) {
        throw new Error(`Invalid host origin: ${trimmed}`);
      }
      continue;
    }
    if (seen.has(origin)) {
      continue;
    }
    seen.add(origin);
    origins.push(origin);
  }

  return origins;
}

/**
 * Visitor routes allow Chat.hostOrigins and dashboard CORS origins.
 */
export function visitorOriginAllowed(
  origin: string | null,
  hostOrigins: string[] | undefined | null,
  opts: {
    dashboardOrigins?: string[];
  } = {},
): boolean {
  if (!origin) {
    return false;
  }

  for (const allowed of hostOrigins ?? []) {
    const hostOrigin = originFromWebsiteUrl(allowed);
    if (hostOrigin && origin === hostOrigin) {
      return true;
    }
  }

  for (const dashboard of opts.dashboardOrigins ?? []) {
    if (dashboard && origin === dashboard) {
      return true;
    }
  }

  return false;
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
