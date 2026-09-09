import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import type { ScrapeResult, ScraperProvider } from './scraper.provider';
@Injectable()
export class PuppeteerScraperProvider implements ScraperProvider {
  async scrape(props: { url: string }): Promise<ScrapeResult> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    try {
      await page.goto(props.url, { waitUntil: 'networkidle0' });
      return {
        url: props.url,
        title: await page.title(),
        html: await page.content(),
      };
    } finally {
      await page.close();
      await browser.close();
    }
  }
}
