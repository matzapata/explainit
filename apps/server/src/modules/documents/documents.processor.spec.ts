import { DocumentsProcessor } from '@src/modules/documents/documents.processor';
import {
  type DocumentsService,
  PermanentIngestError,
} from '@src/modules/documents/documents.service';
import type { CrawlJob, ScrapeJob } from '@src/modules/documents/ingest-job';
import type { Job } from 'bullmq';

describe('DocumentsProcessor', () => {
  const processJob = jest.fn();
  const processCrawl = jest.fn();
  const markFailed = jest.fn();
  const documents = {
    process: processJob,
    processCrawl,
    markFailed,
  } as unknown as DocumentsService;
  const processor = new DocumentsProcessor(documents);

  const scrapeJob = {
    name: 'website',
    data: {
      resourceId: 'resource-1',
      chatId: 'chat-1',
      url: 'https://docs.example.com',
    },
  } as Job<ScrapeJob>;

  const crawlJob = {
    name: 'crawl',
    data: {
      resourceId: 'resource-1',
      chatId: 'chat-1',
      url: 'https://docs.example.com',
      seedUrl: 'https://docs.example.com',
      depth: 0,
      maxDepth: 4,
      maxPages: 50,
    },
  } as Job<CrawlJob>;

  beforeEach(() => {
    processJob.mockReset();
    processCrawl.mockReset();
    markFailed.mockReset();
    processJob.mockResolvedValue(undefined);
    processCrawl.mockResolvedValue(undefined);
    markFailed.mockResolvedValue(undefined);
  });

  it('routes scrape jobs to process', async () => {
    await processor.process(scrapeJob);

    expect(processJob).toHaveBeenCalledWith(scrapeJob.data);
    expect(processCrawl).not.toHaveBeenCalled();
    expect(markFailed).not.toHaveBeenCalled();
  });

  it('routes crawl jobs to processCrawl', async () => {
    await processor.process(crawlJob);

    expect(processCrawl).toHaveBeenCalledWith(crawlJob.data);
    expect(processJob).not.toHaveBeenCalled();
  });

  it('marks permanent failures complete without retrying', async () => {
    processJob.mockRejectedValueOnce(new PermanentIngestError('Empty scrape'));

    await expect(processor.process(scrapeJob)).resolves.toBeUndefined();
    expect(markFailed).toHaveBeenCalledWith('resource-1', 'Empty scrape');
  });

  it('rethrows retryable failures', async () => {
    processJob.mockRejectedValueOnce(new Error('timeout'));

    await expect(processor.process(scrapeJob)).rejects.toThrow('timeout');
    expect(markFailed).not.toHaveBeenCalled();
  });
});
