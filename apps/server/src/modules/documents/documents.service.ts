import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ChatResource, ResourceStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { ChunkingService } from '@src/infra/chunking/chunking.service';
import { CrawlerService } from '@src/infra/crawler/crawler.service';
import { Span } from '@src/infra/observability/decorators/span.decorator';
import { VectorStoreService } from '@src/infra/vector-store/vector-store.service';
import { Prisma } from '@prisma/client';
import { DocumentsRepository } from './documents.repository';
import { INGEST_QUEUE, IngestJob } from './ingest-job';

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
    private readonly crawlerService: CrawlerService,
    private readonly chunkingService: ChunkingService,
    private readonly vectorStoreService: VectorStoreService,
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

    await this.vectorStoreService.deleteDocuments(resource.embeddingIds);
    await this.documentsRepository.delete(id);
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
    await this.vectorStoreService.deleteDocumentsByNamespace(chatId);
  }

  async createTextResource(
    chatId: string,
    data: { text: string; source: string; title: string },
  ): Promise<ChatResource> {
    const documents = await this.chunkingService.generateDocsFromText(
      data,
      chatId,
    );
    const ids = await this.addDocuments(documents);

    return this.create(chatId, {
      data: data.title,
      type: 'text',
      status: ResourceStatus.ready,
      embeddingIds: ids,
    });
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
          data: {
            resourceId: resource.id,
            chatId,
            url: resource.data,
          },
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

  @Span({ name: 'ingest' })
  async process(job: IngestJob): Promise<void> {
    const resource = await this.findById(job.resourceId);
    if (!resource) {
      this.logger.warn(
        `Skipping ingest for deleted resource ${job.resourceId}`,
      );
      return;
    }
    if (resource.status === ResourceStatus.ready) {
      return;
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

    const scraped = await this.crawlerService.scrape({ urls: [job.url] });
    const page = scraped[0];
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
      return;
    }

    await this.update(job.resourceId, {
      status: ResourceStatus.ready,
      embeddingIds: ids,
      error: null,
    });
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
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}
