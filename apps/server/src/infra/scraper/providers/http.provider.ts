import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { ScrapeResult, ScraperProvider } from './scraper.provider';

const USER_AGENT =
  'Mozilla/5.0 (compatible; ExplainitBot/1.0; +https://github.com/matzapata/explainit)';
const FETCH_TIMEOUT_MS = 30_000;

@Injectable()
export class HttpScraperProvider implements ScraperProvider {
  async scrape(props: { url: string }): Promise<ScrapeResult> {
    const response = await fetch(props.url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP scrape failed (${response.status}) for ${props.url}`,
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    return {
      url: props.url,
      title: $('title').first().text().trim(),
      html,
    };
  }
}
