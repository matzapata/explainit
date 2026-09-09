import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  DocumentsService,
  errorMessage,
  PermanentIngestError,
} from './documents.service';
import { type CrawlJob, INGEST_QUEUE, type ScrapeJob } from './ingest-job';
@Processor(INGEST_QUEUE, {
  concurrency: 1,
  lockDuration: 5 * 60 * 1000,
})
export class DocumentsProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentsProcessor.name);

  constructor(private readonly documentsService: DocumentsService) {
    super();
  }

  async process(job: Job<ScrapeJob | CrawlJob>): Promise<void> {
    try {
      if (job.name === 'crawl') {
        await this.documentsService.processCrawl(job.data as CrawlJob);
      } else {
        await this.documentsService.process(job.data);
      }
    } catch (error) {
      if (isPermanent(error)) {
        await this.documentsService.markFailed(
          job.data.resourceId,
          errorMessage(error),
        );
        this.logger.warn(
          `Permanent ingest failure for ${job.data.url}: ${errorMessage(error)}`,
        );
        return;
      }

      this.logger.error(
        `Retryable ingest failure for ${job.data.url}: ${errorMessage(error)}`,
      );
      throw error;
    }
  }
}

function isPermanent(error: unknown): boolean {
  return (
    error instanceof PermanentIngestError ||
    (error as { name?: string })?.name === 'PermanentIngestError'
  );
}
