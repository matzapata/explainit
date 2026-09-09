import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

const ASSET_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.css',
  '.js',
  '.mjs',
  '.map',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.pdf',
  '.zip',
  '.gz',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
]);

@Injectable()
export class CrawlerService {
  nextUrls(props: {
    html: string;
    pageUrl: string;
    seedUrl: string;
  }): string[] {
    const seed = new URL(props.seedUrl);
    const page = new URL(props.pageUrl);
    const $ = cheerio.load(props.html);
    const found = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) {
        return;
      }

      const canonical = canonicalizeLink(href, page);
      if (!canonical) {
        return;
      }
      if (!isSameHost(canonical, seed)) {
        return;
      }
      if (!isUnderSeedPath(canonical.pathname, seed.pathname)) {
        return;
      }
      if (hasAssetExtension(canonical.pathname)) {
        return;
      }

      found.add(canonical.href);
    });

    return Array.from(found);
  }
}

function canonicalizeLink(href: string, pageUrl: URL): URL | null {
  try {
    const base = asDirectoryBase(pageUrl);
    const url = new URL(href, base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    return url;
  } catch {
    return null;
  }
}

/** Treat pathnames without a file extension as directories for relative resolution. */
function asDirectoryBase(url: URL): URL {
  const base = new URL(url.href);
  if (base.pathname.endsWith('/')) {
    return base;
  }
  if (hasAssetExtension(base.pathname)) {
    return base;
  }
  const leaf = base.pathname.split('/').pop() ?? '';
  if (leaf.includes('.')) {
    return base;
  }
  base.pathname = `${base.pathname}/`;
  return base;
}

function isSameHost(candidate: URL, seed: URL): boolean {
  return candidate.hostname.toLowerCase() === seed.hostname.toLowerCase();
}

function isUnderSeedPath(candidatePath: string, seedPath: string): boolean {
  if (seedPath === '/' || seedPath === '') {
    return true;
  }
  const prefix = seedPath.endsWith('/') ? seedPath.slice(0, -1) : seedPath;
  return candidatePath === prefix || candidatePath.startsWith(`${prefix}/`);
}

function hasAssetExtension(pathname: string): boolean {
  const lastSlash = pathname.lastIndexOf('/');
  const filename = pathname.slice(lastSlash + 1);
  const dot = filename.lastIndexOf('.');
  if (dot < 0) {
    return false;
  }
  return ASSET_EXTENSIONS.has(filename.slice(dot).toLowerCase());
}
