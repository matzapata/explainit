export const INGEST_QUEUE = 'ingest';

export const CRAWL_MAX_DEPTH = 4;
export const CRAWL_MAX_PAGES = 50;

export type ScrapeJob = {
  resourceId: string;
  chatId: string;
  url: string;
};

export type CrawlJob = ScrapeJob & {
  seedUrl: string;
  depth: number;
  maxDepth: number;
  maxPages: number;
};
