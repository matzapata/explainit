import { Module } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { FirecrawlScraperProvider } from './providers/firecrawl.provider';
import { PuppeteerScraperProvider } from './providers/puppeteer.provider';
import { ScraperService } from './scraper.service';

@Module({
  providers: [
    {
      provide: ScraperService,
      useFactory: (env: EnvService) => {
        return env.get('SCRAPER_PROVIDER') === 'firecrawl'
          ? new FirecrawlScraperProvider(env)
          : new PuppeteerScraperProvider();
      },
      inject: [EnvService],
    },
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
