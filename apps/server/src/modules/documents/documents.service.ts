import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { type ChatResource, ResourceStatus } from '@prisma/client';
import { ChunkingService } from '@src/infra/chunking/chunking.service';
import { CrawlerService } from '@src/infra/crawler/crawler.service';
import { ObjectStorageService } from '@src/infra/object-storage/object-storage.service';
import { Span } from '@src/infra/observability/decorators/span.decorator';
import { ScraperService } from '@src/infra/scraper/scraper.service';
import { VectorStoreService } from '@src/infra/vector-store/vector-store.service';
import type { Queue } from 'bullmq';
import { DocumentsRepository } from './documents.repository';
import {
  CRAWL_CANCEL_TTL_SECONDS,
  CRAWL_MAX_DEPTH,
  CRAWL_MAX_PAGES,
  CRAWL_SAFETY_MAX_DEPTH,
  CRAWL_SAFETY_MAX_PAGES,
  type CrawlJob,
  crawlCancelledKey,
  INGEST_QUEUE,
  ingestJobId,
  type ScrapeJob,
} from './ingest-job';

export class PermanentIngestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentIngestError';
  }
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    @InjectQueue(INGEST_QUEUE) private readonly ingestQueue: Queue,
    private readonly scraperService: ScraperService,
    private readonly crawlerService: CrawlerService,
    private readonly chunkingService: ChunkingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly objectStorage: ObjectStorageService,
  ) {}

  create(chatId: string, data: Omit<Prisma.ChatResourceCreateInput, 'chat'>) {
    return this.documentsRepository.create({
      ...data,
      chat: { connect: { id: chatId } },
    });
  }

  findById(id: string) {
    return this.documentsRepository.findById(id);
  }

  findByChatId(chatId: string) {
    return this.documentsRepository.findByChatId(chatId);
  }

  findByUrl(chatId: string, url: string) {
    return this.documentsRepository.findByUrl(chatId, url);
  }

  update(id: string, data: Prisma.ChatResourceUpdateInput) {
    return this.documentsRepository.update(id, data);
  }

  async deleteWithEmbeddings(id: string) {
    const resource = await this.documentsRepository.findById(id);
    if (!resource) {
      return null;
    }

    const inflight =
      resource.status === ResourceStatus.pending ||
      resource.status === ResourceStatus.processing;

    if (inflight && resource.crawlId) {
      await this.cancelCrawlCampaign(resource.crawlId);
      return resource;
    }

    await this.removeIngestJob(resource.id);
    await this.deleteResourceRow(resource);
    return resource;
  }

  async addDocuments(
    documents: {
      content: string;
      namespace: string;
      metadata: Record<string, any>;
    }[],
  ) {
    return this.vectorStoreService.addDocuments(documents);
  }

  async deleteDocuments(ids: string[]) {
    return this.vectorStoreService.deleteDocuments(ids);
  }

  async deleteChatNamespace(chatId: string) {
    const resources = await this.findByChatId(chatId);
    await Promise.all(
      resources.map((resource) => this.removeIngestJob(resource.id)),
    );
    await Promise.all(
      resources
        .filter((resource) => resource.type === 'text')
        .map((resource) =>
          this.objectStorage.deleteFile(textObjectKey(chatId, resource.id)),
        ),
    );
    await this.vectorStoreService.deleteDocumentsByNamespace(chatId);
  }

  async createTextResource(
    chatId: string,
    data: { text: string; title: string },
  ): Promise<ChatResource> {
    const id = randomUUID();
    const key = textObjectKey(chatId, id);
    await this.objectStorage.uploadFile(key, Buffer.from(data.text));
    const publicUrl = this.objectStorage.buildPublicUrl(key);

    let embeddingIds: string[] = [];
    try {
      const documents = await this.chunkingService.generateDocsFromText(
        {
          text: data.text,
          source: publicUrl,
          title: data.title,
        },
        chatId,
      );
      embeddingIds = await this.addDocuments(documents);

      return await this.create(chatId, {
        id,
        data: publicUrl,
        title: data.title,
        type: 'text',
        status: ResourceStatus.ready,
        embeddingIds,
      });
    } catch (error) {
      if (embeddingIds.length > 0) {
        await this.deleteDocuments(embeddingIds);
      }
      await this.objectStorage.deleteFile(key);
      throw error;
    }
  }

  async enqueueWebsiteUrls(
    chatId: string,
    urls: string[],
  ): Promise<ChatResource[]> {
    const resources = await this.findByChatId(chatId);
    const existingUrls = resources.map((resource) => resource.data);
    const newUrls = urls.filter((url) => !existingUrls.includes(url));
    if (newUrls.length === 0) {
      throw new BadRequestException('No new urls to add');
    }

    const created: ChatResource[] = [];
    for (const url of newUrls) {
      created.push(
        await this.create(chatId, {
          data: url,
          type: 'website',
          status: ResourceStatus.pending,
          embeddingIds: [],
        }),
      );
    }

    try {
      await this.ingestQueue.addBulk(
        created.map((resource) => ({
          name: 'website',
          opts: { jobId: ingestJobId(resource.id) },
          data: {
            resourceId: resource.id,
            chatId,
            url: resource.data,
          } satisfies ScrapeJob,
        })),
      );
    } catch (error) {
      await Promise.all(
        created.map((resource) =>
          this.markFailed(resource.id, errorMessage(error)),
        ),
      );
      throw error;
    }

    return created;
  }

  async enqueueWebsiteCrawl(
    chatId: string,
    url: string,
    options: { unlimited?: boolean } = {},
  ): Promise<ChatResource> {
    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    const existing = await this.findByUrl(chatId, url);
    if (existing) {
      throw new BadRequestException('URL already added');
    }

    const maxPages = options.unlimited
      ? CRAWL_SAFETY_MAX_PAGES
      : CRAWL_MAX_PAGES;
    const maxDepth = options.unlimited
      ? CRAWL_SAFETY_MAX_DEPTH
      : CRAWL_MAX_DEPTH;

    const resources = await this.findByChatId(chatId);
    const websiteCount = resources.filter((r) => r.type === 'website').length;
    if (websiteCount >= maxPages) {
      throw new BadRequestException(
        `Chat already has ${maxPages} website resources`,
      );
    }

    const crawlId = randomUUID();
    const created = await this.create(chatId, {
      data: url,
      type: 'website',
      status: ResourceStatus.pending,
      embeddingIds: [],
      crawlId,
    });

    try {
      await this.ingestQueue.add(
        'crawl',
        {
          resourceId: created.id,
          chatId,
          url,
          crawlId,
          seedUrl: url,
          depth: 0,
          maxDepth,
          maxPages,
        } satisfies CrawlJob,
        { jobId: ingestJobId(created.id) },
      );
    } catch (error) {
      await this.markFailed(created.id, errorMessage(error));
      throw error;
    }

    return created;
  }

  @Span({ name: 'ingest' })
  async process(job: ScrapeJob): Promise<void> {
    await this.ingestPage(job);
  }

  @Span({ name: 'ingest-crawl' })
  async processCrawl(job: CrawlJob): Promise<void> {
    const page = await this.ingestPage(job);
    if (!page) {
      return;
    }

    if (job.depth >= job.maxDepth) {
      return;
    }

    if (await this.isCrawlCancelled(job.crawlId)) {
      this.logger.warn(`Skipping fan-out for cancelled crawl ${job.crawlId}`);
      return;
    }

    const candidates = this.crawlerService.nextUrls({
      html: page.html,
      pageUrl: job.url,
      seedUrl: job.seedUrl,
    });

    const resources = await this.findByChatId(job.chatId);
    const websiteCount = resources.filter((r) => r.type === 'website').length;
    let slots = job.maxPages - websiteCount;
    if (slots <= 0) {
      return;
    }

    const existingUrls = new Set(
      resources.map((resource) => resource.data.toLowerCase()),
    );

    for (const candidate of candidates) {
      if (slots <= 0) {
        break;
      }
      if (await this.isCrawlCancelled(job.crawlId)) {
        this.logger.warn(
          `Stopping fan-out mid-loop for cancelled crawl ${job.crawlId}`,
        );
        return;
      }
      if (existingUrls.has(candidate.toLowerCase())) {
        continue;
      }

      const created = await this.create(job.chatId, {
        data: candidate,
        type: 'website',
        status: ResourceStatus.pending,
        embeddingIds: [],
        crawlId: job.crawlId,
      });
      existingUrls.add(candidate.toLowerCase());
      slots -= 1;

      try {
        await this.ingestQueue.add(
          'crawl',
          {
            resourceId: created.id,
            chatId: job.chatId,
            url: candidate,
            crawlId: job.crawlId,
            seedUrl: job.seedUrl,
            depth: job.depth + 1,
            maxDepth: job.maxDepth,
            maxPages: job.maxPages,
          } satisfies CrawlJob,
          { jobId: ingestJobId(created.id) },
        );
      } catch (error) {
        await this.markFailed(created.id, errorMessage(error));
      }
    }
  }

  private async ingestPage(
    job: ScrapeJob,
  ): Promise<{ html: string; title: string; url: string } | null> {
    const resource = await this.findById(job.resourceId);
    if (!resource) {
      this.logger.warn(
        `Skipping ingest for deleted resource ${job.resourceId}`,
      );
      return null;
    }
    if (resource.status === ResourceStatus.ready) {
      return null;
    }

    try {
      new URL(job.url);
    } catch {
      throw new PermanentIngestError(`Invalid URL: ${job.url}`);
    }

    await this.update(job.resourceId, {
      status: ResourceStatus.processing,
      error: null,
    });

    const page = await this.scraperService.scrape({ url: job.url });
    if (!page?.html) {
      throw new PermanentIngestError(`Empty scrape for ${job.url}`);
    }

    const documents = await this.chunkingService.generateDocsFromHtml(
      page,
      job.chatId,
    );
    const ids = await this.addDocuments(documents);

    const stillExists = await this.findById(job.resourceId);
    if (!stillExists) {
      await this.deleteDocuments(ids);
      return null;
    }

    await this.update(job.resourceId, {
      status: ResourceStatus.ready,
      title: page.title || stillExists.title,
      embeddingIds: ids,
      error: null,
    });

    return page;
  }

  async markFailed(resourceId: string, error: string): Promise<void> {
    const resource = await this.findById(resourceId);
    if (!resource) {
      return;
    }

    await this.update(resourceId, {
      status: ResourceStatus.failed,
      error,
    });
  }

  private async cancelCrawlCampaign(crawlId: string): Promise<void> {
    await this.flagCrawlCancelled(crawlId);

    const inflight = await this.documentsRepository.findByCrawlIdAndStatuses(
      crawlId,
      [ResourceStatus.pending, ResourceStatus.processing],
    );

    await Promise.all(
      inflight.map(async (resource) => {
        await this.removeIngestJob(resource.id);
        await this.deleteResourceRow(resource);
      }),
    );
  }

  private async deleteResourceRow(resource: ChatResource): Promise<void> {
    await this.vectorStoreService.deleteDocuments(resource.embeddingIds);
    if (resource.type === 'text') {
      await this.objectStorage.deleteFile(
        textObjectKey(resource.chatId, resource.id),
      );
    }
    await this.documentsRepository.delete(resource.id);
  }

  private async removeIngestJob(resourceId: string): Promise<void> {
    try {
      const job = await this.ingestQueue.getJob(ingestJobId(resourceId));
      if (!job) {
        return;
      }
      await job.remove();
    } catch (error) {
      this.logger.warn(
        `Could not remove ingest job for ${resourceId}: ${errorMessage(error)}`,
      );
    }
  }

  private async flagCrawlCancelled(crawlId: string): Promise<void> {
    const client = await this.ingestQueue.client;
    await client.set(crawlCancelledKey(crawlId), '1', {
      EX: CRAWL_CANCEL_TTL_SECONDS,
    });
  }

  private async isCrawlCancelled(crawlId: string): Promise<boolean> {
    const client = await this.ingestQueue.client;
    const value = await client.get(crawlCancelledKey(crawlId));
    return value === '1';
  }
}

export function textObjectKey(chatId: string, resourceId: string): string {
  return `resources/${chatId}/${resourceId}.md`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}
