export interface ScrapeResult {
  html: string;
  title: string;
  url: string;
}

export abstract class ScraperProvider {
  abstract scrape(props: { url: string }): Promise<ScrapeResult>;
}
