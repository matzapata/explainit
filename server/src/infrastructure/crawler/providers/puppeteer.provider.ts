import puppeteer from 'puppeteer';
import { CrawlerProvider, ScrapeResult } from './crawler.provider';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PuppeteerCrawlerProvider implements CrawlerProvider {
  async crawl(props: {
    url: string;
    maxRequests: number;
  }): Promise<ScrapeResult[]> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    const baseDomain = new URL(props.url).hostname;

    //  scrape first page and get links to start crawling
    await page.goto(props.url, { waitUntil: 'networkidle0' });
    const links = await page.$$eval('a', (as) => as.map((a) => a.href));
    const urls = Array.from(
      new Set(
        links
          .filter((link) => link.startsWith('/') || link.includes(baseDomain)) // filter only links within same domain
          .filter((u) => u === props.url), // remove first page
      ),
    );

    // initiate result array with first page
    const result = [
      {
        url: props.url,
        title: await page.title(),
        html: await page.content(),
      },
    ];

    // crawl remaining pages. Initiate requests counter with 1 to account for first page
    let requests = 1;
    while (urls.length > 0 && requests < props.maxRequests) {
      const url = urls.shift();
      await page.goto(url, { waitUntil: 'networkidle0' });
      result.push({
        url: url,
        title: await page.title(),
        html: await page.content(),
      });
      requests++;
    }

    await page.close();
    await browser.close();
    return result;
  }

  async scrape(props: { urls: string[] }): Promise<ScrapeResult[]> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    const result = [];
    const urls = [...props.urls];
    while (urls.length > 0) {
      const url = urls.shift();
      await page.goto(url, { waitUntil: 'networkidle0' });
      result.push({
        url: url,
        title: await page.title(),
        html: await page.content(),
      });
    }

    await page.close();
    await browser.close();

    return result;
  }

  async inspect(props: { url: string }): Promise<string[]> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    const baseDomain = new URL(props.url).hostname;

    //  scrape first page and get links to start crawling
    await page.goto(props.url, { waitUntil: 'networkidle0' });
    const links = await page.$$eval(
      'a',
      (as) => as.map((a) => a.href.split('#')[0].split('?')[0]), // remove anchor links
    );
    const urls = Array.from(
      new Set(
        links.filter(
          (link) => link.startsWith('/') || link.includes(baseDomain),
        ), // filter only links within same domain
      ),
    );

    await page.close();
    await browser.close();

    return urls;
  }
}
