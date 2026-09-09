export const INGEST_QUEUE = 'ingest';

export const CRAWL_MAX_DEPTH = 4;
export const CRAWL_MAX_PAGES = 50;

/** Hidden ceiling when the user opts into unbounded crawl. */
export const CRAWL_SAFETY_MAX_DEPTH = 16;
export const CRAWL_SAFETY_MAX_PAGES = 500;

export const CRAWL_CANCEL_TTL_SECONDS = 24 * 60 * 60;

export type ScrapeJob = {
  resourceId: string;
  chatId: string;
  url: string;
};

export type CrawlJob = ScrapeJob & {
  crawlId: string;
  seedUrl: string;
  depth: number;
  maxDepth: number;
  maxPages: number;
};

export function ingestJobId(resourceId: string): string {
  return `ingest-${resourceId}`;
}

export function crawlCancelledKey(crawlId: string): string {
  return `ingest:cancelled:${crawlId}`;
}
