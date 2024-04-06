export interface ScrapeResult {
  html: string;
  title: string;
  url: string;
}

export abstract class CrawlerProvider {
  // Get the html from a given url
  abstract crawl(props: {
    url: string;
    domain: string;
    maxRequests: number;
  }): Promise<ScrapeResult[]>;

  abstract scrape(props: { urls: string[] }): Promise<ScrapeResult[]>;

  abstract inspect(props: { url: string }): Promise<string[]>;
}
