import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import type { ScrapeResult, ScraperProvider } from './scraper.provider';

type FirecrawlScrapeBody = {
  error?: string | { message?: string };
  data?: {
    rawHtml?: string | null;
    metadata?: {
      title?: string | string[];
    };
  };
};

@Injectable()
export class FirecrawlScraperProvider implements ScraperProvider {
  constructor(private readonly env: EnvService) {}

  async scrape(props: { url: string }): Promise<ScrapeResult> {
    const baseURL = this.env.get('FIRECRAWL_API_URL').replace(/\/+$/, '');
    const response = await fetch(`${baseURL}/scrape`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.get('FIRECRAWL_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: props.url,
        formats: ['rawHtml'],
        onlyMainContent: false,
      }),
    });

    const body = (await response.json()) as FirecrawlScrapeBody;

    if (!response.ok) {
      throw new Error(firecrawlError(body, response.status));
    }

    return {
      url: props.url,
      title: firstTitle(body.data?.metadata?.title),
      html: body.data?.rawHtml ?? '',
    };
  }
}

function firstTitle(title: string | string[] | undefined): string {
  if (typeof title === 'string') {
    return title;
  }
  if (Array.isArray(title) && typeof title[0] === 'string') {
    return title[0];
  }
  return '';
}

function firecrawlError(body: FirecrawlScrapeBody, status: number): string {
  if (typeof body.error === 'string') {
    return body.error;
  }
  return body.error?.message ?? `Firecrawl scrape failed (${status})`;
}
