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

/**
 * Visitor routes allow the Chat Website origin, dashboard CORS origins,
 * and (in development) any localhost / 127.0.0.1 Host page.
 */
export function visitorOriginAllowed(
  origin: string | null,
  websiteUrl: string | undefined | null,
  opts: {
    dashboardOrigins?: string[];
    development?: boolean;
  } = {},
): boolean {
  if (!origin) {
    return false;
  }

  const websiteOrigin = originFromWebsiteUrl(websiteUrl);
  if (websiteOrigin && origin === websiteOrigin) {
    return true;
  }

  for (const dashboard of opts.dashboardOrigins ?? []) {
    if (dashboard && origin === dashboard) {
      return true;
    }
  }

  if (opts.development) {
    try {
      const host = new URL(origin).hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return true;
      }
    } catch {
      return false;
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
