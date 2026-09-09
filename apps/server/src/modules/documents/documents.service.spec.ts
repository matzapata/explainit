import { TestBed } from '@automock/jest';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { ResourceStatus } from '@prisma/client';
import { ChunkingService } from '@src/infra/chunking/chunking.service';
import { CrawlerService } from '@src/infra/crawler/crawler.service';
import { ObjectStorageService } from '@src/infra/object-storage/object-storage.service';
import { ScraperService } from '@src/infra/scraper/scraper.service';
import { VectorStoreService } from '@src/infra/vector-store/vector-store.service';
import type { Queue } from 'bullmq';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService, PermanentIngestError } from './documents.service';
import {
  CRAWL_MAX_DEPTH,
  CRAWL_MAX_PAGES,
  CRAWL_SAFETY_MAX_DEPTH,
  CRAWL_SAFETY_MAX_PAGES,
  crawlCancelledKey,
  INGEST_QUEUE,
  ingestJobId,
} from './ingest-job';

jest.mock('node:crypto', () => ({
  ...jest.requireActual('node:crypto'),
  randomUUID: () => 'resource-1',
}));

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentsRepository: jest.Mocked<DocumentsRepository>;
  let ingestQueue: jest.Mocked<Queue>;
  let scraperService: jest.Mocked<ScraperService>;
  let crawlerService: jest.Mocked<CrawlerService>;
  let chunkingService: jest.Mocked<ChunkingService>;
  let vectorStoreService: jest.Mocked<VectorStoreService>;
  let objectStorage: jest.Mocked<ObjectStorageService>;
  let redisClient: { get: jest.Mock; set: jest.Mock };

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(DocumentsService).compile();
    service = unit;
    documentsRepository = unitRef.get(DocumentsRepository);
    ingestQueue = unitRef.get(getQueueToken(INGEST_QUEUE));
    scraperService = unitRef.get(ScraperService);
    crawlerService = unitRef.get(CrawlerService);
    chunkingService = unitRef.get(ChunkingService);
    vectorStoreService = unitRef.get(VectorStoreService);
    objectStorage = unitRef.get(ObjectStorageService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };
    Object.defineProperty(ingestQueue, 'client', {
      value: Promise.resolve(redisClient),
      configurable: true,
      writable: true,
    });
    ingestQueue.getJob.mockResolvedValue(undefined as never);
  });

  describe('enqueueWebsiteUrls', () => {
    it('creates pending resources and enqueues one job per URL', async () => {
      documentsRepository.findByChatId.mockResolvedValue([
        {
          id: 'existing',
          data: 'https://docs.example.com/old',
        } as never,
      ]);
      documentsRepository.create.mockResolvedValue({
        id: 'resource-1',
        data: 'https://docs.example.com/new',
        type: 'website',
        status: ResourceStatus.pending,
      } as never);

      const result = await service.enqueueWebsiteUrls('chat-1', [
        'https://docs.example.com/old',
        'https://docs.example.com/new',
      ]);

      expect(documentsRepository.create).toHaveBeenCalledWith({
        data: 'https://docs.example.com/new',
        type: 'website',
        status: ResourceStatus.pending,
        embeddingIds: [],
        chat: { connect: { id: 'chat-1' } },
      });
      expect(ingestQueue.addBulk).toHaveBeenCalledWith([
        {
          name: 'website',
          opts: { jobId: ingestJobId('resource-1') },
          data: {
            resourceId: 'resource-1',
            chatId: 'chat-1',
            url: 'https://docs.example.com/new',
          },
        },
      ]);
      expect(result).toHaveLength(1);
    });

    it('rejects when every URL is already ingested', async () => {
      documentsRepository.findByChatId.mockResolvedValue([
        { data: 'https://docs.example.com' } as never,
      ]);

      await expect(
        service.enqueueWebsiteUrls('chat-1', ['https://docs.example.com']),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(ingestQueue.addBulk).not.toHaveBeenCalled();
    });

    it('marks resources failed when enqueue fails', async () => {
      documentsRepository.findByChatId.mockResolvedValue([]);
      documentsRepository.create.mockResolvedValue({
        id: 'resource-1',
        data: 'https://docs.example.com',
      } as never);
      documentsRepository.findById.mockResolvedValue({
        id: 'resource-1',
      } as never);
      ingestQueue.addBulk.mockRejectedValue(new Error('redis down'));

      await expect(
        service.enqueueWebsiteUrls('chat-1', ['https://docs.example.com']),
      ).rejects.toThrow('redis down');
      expect(documentsRepository.update).toHaveBeenCalledWith('resource-1', {
        status: ResourceStatus.failed,
        error: 'redis down',
      });
    });
  });

  describe('enqueueWebsiteCrawl', () => {
    it('creates a pending seed and enqueues a crawl job', async () => {
      documentsRepository.findByUrl.mockResolvedValue(null);
      documentsRepository.findByChatId.mockResolvedValue([]);
      documentsRepository.create.mockResolvedValue({
        id: 'resource-1',
        data: 'https://docs.example.com/guide',
        type: 'website',
        status: ResourceStatus.pending,
        crawlId: 'resource-1',
      } as never);
      ingestQueue.add.mockResolvedValue({} as never);

      const result = await service.enqueueWebsiteCrawl(
        'chat-1',
        'https://docs.example.com/guide',
      );

      expect(documentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          crawlId: 'resource-1',
          status: ResourceStatus.pending,
        }),
      );
      expect(ingestQueue.add).toHaveBeenCalledWith(
        'crawl',
        {
          resourceId: 'resource-1',
          chatId: 'chat-1',
          url: 'https://docs.example.com/guide',
          crawlId: 'resource-1',
          seedUrl: 'https://docs.example.com/guide',
          depth: 0,
          maxDepth: CRAWL_MAX_DEPTH,
          maxPages: CRAWL_MAX_PAGES,
        },
        { jobId: ingestJobId('resource-1') },
      );
      expect(result.id).toBe('resource-1');
    });

    it('uses the safety ceiling when unlimited is true', async () => {
      documentsRepository.findByUrl.mockResolvedValue(null);
      documentsRepository.findByChatId.mockResolvedValue([]);
      documentsRepository.create.mockResolvedValue({
        id: 'resource-1',
        data: 'https://docs.example.com/guide',
        type: 'website',
        status: ResourceStatus.pending,
        crawlId: 'resource-1',
      } as never);
      ingestQueue.add.mockResolvedValue({} as never);

      await service.enqueueWebsiteCrawl(
        'chat-1',
        'https://docs.example.com/guide',
        { unlimited: true },
      );

      expect(ingestQueue.add).toHaveBeenCalledWith(
        'crawl',
        expect.objectContaining({
          maxDepth: CRAWL_SAFETY_MAX_DEPTH,
          maxPages: CRAWL_SAFETY_MAX_PAGES,
        }),
        { jobId: ingestJobId('resource-1') },
      );
    });

    it('rejects when the URL is already added', async () => {
      documentsRepository.findByUrl.mockResolvedValue({
        id: 'existing',
      } as never);

      await expect(
        service.enqueueWebsiteCrawl('chat-1', 'https://docs.example.com'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(ingestQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('process', () => {
    it('scrapes, embeds, and marks the resource ready with title', async () => {
      documentsRepository.findById
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.pending,
        } as never)
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.processing,
          title: null,
        } as never);
      scraperService.scrape.mockResolvedValue({
        url: 'https://docs.example.com',
        title: 'Docs',
        html: '<p>hello</p>',
      });
      chunkingService.generateDocsFromHtml.mockResolvedValue([
        { content: 'hello', namespace: 'chat-1', metadata: {} },
      ]);
      vectorStoreService.addDocuments.mockResolvedValue(['emb-1']);

      await service.process({
        resourceId: 'resource-1',
        chatId: 'chat-1',
        url: 'https://docs.example.com',
      });

      expect(scraperService.scrape).toHaveBeenCalledWith({
        url: 'https://docs.example.com',
      });
      expect(crawlerService.nextUrls).not.toHaveBeenCalled();
      expect(documentsRepository.update).toHaveBeenLastCalledWith(
        'resource-1',
        {
          status: ResourceStatus.ready,
          title: 'Docs',
          embeddingIds: ['emb-1'],
          error: null,
        },
      );
    });

    it('skips deleted and already-ready resources', async () => {
      documentsRepository.findById.mockResolvedValueOnce(null);
      await service.process({
        resourceId: 'missing',
        chatId: 'chat-1',
        url: 'https://docs.example.com',
      });
      expect(scraperService.scrape).not.toHaveBeenCalled();

      documentsRepository.findById.mockResolvedValueOnce({
        id: 'resource-1',
        status: ResourceStatus.ready,
      } as never);
      await service.process({
        resourceId: 'resource-1',
        chatId: 'chat-1',
        url: 'https://docs.example.com',
      });
      expect(scraperService.scrape).not.toHaveBeenCalled();
    });

    it('treats empty scrapes as permanent failures', async () => {
      documentsRepository.findById.mockResolvedValue({
        id: 'resource-1',
        status: ResourceStatus.pending,
      } as never);
      scraperService.scrape.mockResolvedValue({
        url: 'https://docs.example.com',
        title: '',
        html: '',
      });

      await expect(
        service.process({
          resourceId: 'resource-1',
          chatId: 'chat-1',
          url: 'https://docs.example.com',
        }),
      ).rejects.toBeInstanceOf(PermanentIngestError);
    });

    it('treats invalid URLs as permanent failures', async () => {
      documentsRepository.findById.mockResolvedValue({
        id: 'resource-1',
        status: ResourceStatus.pending,
      } as never);

      await expect(
        service.process({
          resourceId: 'resource-1',
          chatId: 'chat-1',
          url: 'not a url',
        }),
      ).rejects.toBeInstanceOf(PermanentIngestError);
      expect(scraperService.scrape).not.toHaveBeenCalled();
    });

    it('deletes embeddings when the resource is removed mid-ingest', async () => {
      documentsRepository.findById
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.pending,
        } as never)
        .mockResolvedValueOnce(null);
      scraperService.scrape.mockResolvedValue({
        url: 'https://docs.example.com',
        title: 'Docs',
        html: '<p>hello</p>',
      });
      chunkingService.generateDocsFromHtml.mockResolvedValue([
        { content: 'hello', namespace: 'chat-1', metadata: {} },
      ]);
      vectorStoreService.addDocuments.mockResolvedValue(['emb-1']);

      await service.process({
        resourceId: 'resource-1',
        chatId: 'chat-1',
        url: 'https://docs.example.com',
      });

      expect(vectorStoreService.deleteDocuments).toHaveBeenCalledWith([
        'emb-1',
      ]);
      expect(documentsRepository.update).not.toHaveBeenCalledWith(
        'resource-1',
        expect.objectContaining({ status: ResourceStatus.ready }),
      );
    });
  });

  describe('processCrawl', () => {
    const crawlJob = {
      resourceId: 'resource-1',
      chatId: 'chat-1',
      url: 'https://docs.example.com/guide',
      crawlId: 'crawl-1',
      seedUrl: 'https://docs.example.com/guide',
      depth: 0,
      maxDepth: CRAWL_MAX_DEPTH,
      maxPages: CRAWL_MAX_PAGES,
    };

    function mockSuccessfulIngest() {
      documentsRepository.findById
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.pending,
        } as never)
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.processing,
          title: null,
        } as never);
      scraperService.scrape.mockResolvedValue({
        url: crawlJob.url,
        title: 'Guide',
        html: '<a href="/guide/a">a</a>',
      });
      chunkingService.generateDocsFromHtml.mockResolvedValue([
        { content: 'hello', namespace: 'chat-1', metadata: {} },
      ]);
      vectorStoreService.addDocuments.mockResolvedValue(['emb-1']);
    }

    it('indexes the page then enqueues child crawl jobs', async () => {
      mockSuccessfulIngest();
      crawlerService.nextUrls.mockReturnValue([
        'https://docs.example.com/guide/a',
        'https://docs.example.com/guide/b',
      ]);
      documentsRepository.findByChatId.mockResolvedValue([
        {
          id: 'resource-1',
          type: 'website',
          data: crawlJob.url,
        },
      ] as never);
      documentsRepository.create
        .mockResolvedValueOnce({
          id: 'child-a',
          data: 'https://docs.example.com/guide/a',
        } as never)
        .mockResolvedValueOnce({
          id: 'child-b',
          data: 'https://docs.example.com/guide/b',
        } as never);
      ingestQueue.add.mockResolvedValue({} as never);

      await service.processCrawl(crawlJob);

      expect(crawlerService.nextUrls).toHaveBeenCalledWith({
        html: '<a href="/guide/a">a</a>',
        pageUrl: crawlJob.url,
        seedUrl: crawlJob.seedUrl,
      });
      expect(documentsRepository.create).toHaveBeenCalledTimes(2);
      expect(documentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          crawlId: 'crawl-1',
          data: 'https://docs.example.com/guide/a',
        }),
      );
      expect(ingestQueue.add).toHaveBeenCalledWith(
        'crawl',
        expect.objectContaining({
          resourceId: 'child-a',
          crawlId: 'crawl-1',
          url: 'https://docs.example.com/guide/a',
          depth: 1,
          seedUrl: crawlJob.seedUrl,
        }),
        { jobId: ingestJobId('child-a') },
      );
      expect(ingestQueue.add).toHaveBeenCalledWith(
        'crawl',
        expect.objectContaining({
          resourceId: 'child-b',
          url: 'https://docs.example.com/guide/b',
          depth: 1,
        }),
        { jobId: ingestJobId('child-b') },
      );
    });

    it('does not fan out when the crawl is cancelled', async () => {
      mockSuccessfulIngest();
      redisClient.get.mockResolvedValue('1');

      await service.processCrawl(crawlJob);

      expect(crawlerService.nextUrls).not.toHaveBeenCalled();
      expect(ingestQueue.add).not.toHaveBeenCalled();
      expect(redisClient.get).toHaveBeenCalledWith(
        crawlCancelledKey('crawl-1'),
      );
    });

    it('does not fan out when depth is at max', async () => {
      mockSuccessfulIngest();

      await service.processCrawl({ ...crawlJob, depth: CRAWL_MAX_DEPTH });

      expect(crawlerService.nextUrls).not.toHaveBeenCalled();
      expect(ingestQueue.add).not.toHaveBeenCalled();
    });

    it('skips existing URLs and respects maxPages', async () => {
      mockSuccessfulIngest();
      crawlerService.nextUrls.mockReturnValue([
        'https://docs.example.com/guide/existing',
        'https://docs.example.com/guide/new',
        'https://docs.example.com/guide/overflow',
      ]);
      documentsRepository.findByChatId.mockResolvedValue([
        { id: 'resource-1', type: 'website', data: crawlJob.url },
        {
          id: 'existing',
          type: 'website',
          data: 'https://docs.example.com/guide/existing',
        },
        ...Array.from({ length: CRAWL_MAX_PAGES - 3 }, (_, i) => ({
          id: `filler-${i}`,
          type: 'website',
          data: `https://docs.example.com/page-${i}`,
        })),
      ] as never);
      documentsRepository.create.mockResolvedValue({
        id: 'child-new',
        data: 'https://docs.example.com/guide/new',
      } as never);
      ingestQueue.add.mockResolvedValue({} as never);

      await service.processCrawl(crawlJob);

      expect(documentsRepository.create).toHaveBeenCalledTimes(1);
      expect(documentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'https://docs.example.com/guide/new',
        }),
      );
      expect(ingestQueue.add).toHaveBeenCalledTimes(1);
    });

    it('does not fan out when scrape fails', async () => {
      documentsRepository.findById.mockResolvedValue({
        id: 'resource-1',
        status: ResourceStatus.pending,
      } as never);
      scraperService.scrape.mockResolvedValue({
        url: crawlJob.url,
        title: '',
        html: '',
      });

      await expect(service.processCrawl(crawlJob)).rejects.toBeInstanceOf(
        PermanentIngestError,
      );
      expect(crawlerService.nextUrls).not.toHaveBeenCalled();
      expect(ingestQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('createTextResource', () => {
    it('uploads, chunks, embeds, and stores the public URL', async () => {
      const publicUrl =
        'http://localhost:4566/explainit/resources/chat-1/resource-1.md';
      objectStorage.uploadFile.mockResolvedValue(undefined);
      objectStorage.buildPublicUrl.mockReturnValue(publicUrl);
      chunkingService.generateDocsFromText.mockResolvedValue([
        {
          content: 'hello',
          namespace: 'chat-1',
          metadata: { source: publicUrl, title: 'Notes' },
        },
      ]);
      vectorStoreService.addDocuments.mockResolvedValue(['emb-1']);
      documentsRepository.create.mockResolvedValue({
        id: 'resource-1',
        type: 'text',
        data: publicUrl,
        title: 'Notes',
        status: ResourceStatus.ready,
        embeddingIds: ['emb-1'],
      } as never);

      const result = await service.createTextResource('chat-1', {
        text: 'hello',
        title: 'Notes',
      });

      expect(objectStorage.uploadFile).toHaveBeenCalledWith(
        'resources/chat-1/resource-1.md',
        Buffer.from('hello'),
      );
      expect(chunkingService.generateDocsFromText).toHaveBeenCalledWith(
        { text: 'hello', source: publicUrl, title: 'Notes' },
        'chat-1',
      );
      expect(documentsRepository.create).toHaveBeenCalledWith({
        id: 'resource-1',
        data: publicUrl,
        title: 'Notes',
        type: 'text',
        status: ResourceStatus.ready,
        embeddingIds: ['emb-1'],
        chat: { connect: { id: 'chat-1' } },
      });
      expect(result.id).toBe('resource-1');
    });

    it('deletes the object and embeddings when create fails', async () => {
      const publicUrl =
        'http://localhost:4566/explainit/resources/chat-1/resource-1.md';
      objectStorage.uploadFile.mockResolvedValue(undefined);
      objectStorage.buildPublicUrl.mockReturnValue(publicUrl);
      chunkingService.generateDocsFromText.mockResolvedValue([
        { content: 'hello', namespace: 'chat-1', metadata: {} },
      ]);
      vectorStoreService.addDocuments.mockResolvedValue(['emb-1']);
      documentsRepository.create.mockRejectedValue(new Error('db down'));

      await expect(
        service.createTextResource('chat-1', {
          text: 'hello',
          title: 'Notes',
        }),
      ).rejects.toThrow('db down');

      expect(vectorStoreService.deleteDocuments).toHaveBeenCalledWith([
        'emb-1',
      ]);
      expect(objectStorage.deleteFile).toHaveBeenCalledWith(
        'resources/chat-1/resource-1.md',
      );
    });
  });

  describe('deleteWithEmbeddings', () => {
    it('returns null when the resource is missing', async () => {
      documentsRepository.findById.mockResolvedValue(null);

      await expect(service.deleteWithEmbeddings('missing')).resolves.toBeNull();
      expect(vectorStoreService.deleteDocuments).not.toHaveBeenCalled();
    });

    it('deletes vectors, the object for text resources, then the row', async () => {
      const resource = {
        id: 'resource-1',
        chatId: 'chat-1',
        type: 'text',
        status: ResourceStatus.ready,
        crawlId: null,
        embeddingIds: ['emb-1', 'emb-2'],
      };
      documentsRepository.findById.mockResolvedValue(resource as never);
      documentsRepository.delete.mockResolvedValue(resource as never);

      await expect(service.deleteWithEmbeddings('resource-1')).resolves.toEqual(
        resource,
      );
      expect(vectorStoreService.deleteDocuments).toHaveBeenCalledWith([
        'emb-1',
        'emb-2',
      ]);
      expect(objectStorage.deleteFile).toHaveBeenCalledWith(
        'resources/chat-1/resource-1.md',
      );
      expect(documentsRepository.delete).toHaveBeenCalledWith('resource-1');
    });

    it('does not delete an S3 object for website resources', async () => {
      const resource = {
        id: 'resource-1',
        chatId: 'chat-1',
        type: 'website',
        status: ResourceStatus.ready,
        crawlId: null,
        embeddingIds: ['emb-1'],
      };
      documentsRepository.findById.mockResolvedValue(resource as never);
      documentsRepository.delete.mockResolvedValue(resource as never);

      await service.deleteWithEmbeddings('resource-1');

      expect(objectStorage.deleteFile).not.toHaveBeenCalled();
      expect(documentsRepository.delete).toHaveBeenCalledWith('resource-1');
    });

    it('removes the ingest job when deleting a pending single-page resource', async () => {
      const resource = {
        id: 'resource-1',
        chatId: 'chat-1',
        type: 'website',
        status: ResourceStatus.pending,
        crawlId: null,
        embeddingIds: [],
      };
      const job = { remove: jest.fn().mockResolvedValue(undefined) };
      documentsRepository.findById.mockResolvedValue(resource as never);
      documentsRepository.delete.mockResolvedValue(resource as never);
      ingestQueue.getJob.mockResolvedValue(job as never);

      await service.deleteWithEmbeddings('resource-1');

      expect(ingestQueue.getJob).toHaveBeenCalledWith(
        ingestJobId('resource-1'),
      );
      expect(job.remove).toHaveBeenCalled();
      expect(documentsRepository.delete).toHaveBeenCalledWith('resource-1');
      expect(redisClient.set).not.toHaveBeenCalled();
    });

    it('cancels the crawl campaign for an inflight crawl page', async () => {
      const clicked = {
        id: 'pending-1',
        chatId: 'chat-1',
        type: 'website',
        status: ResourceStatus.pending,
        crawlId: 'crawl-1',
        embeddingIds: [],
      };
      const sibling = {
        id: 'pending-2',
        chatId: 'chat-1',
        type: 'website',
        status: ResourceStatus.processing,
        crawlId: 'crawl-1',
        embeddingIds: [],
      };
      const job1 = { remove: jest.fn().mockResolvedValue(undefined) };
      const job2 = { remove: jest.fn().mockResolvedValue(undefined) };
      documentsRepository.findById.mockResolvedValue(clicked as never);
      documentsRepository.findByCrawlIdAndStatuses.mockResolvedValue([
        clicked,
        sibling,
      ] as never);
      documentsRepository.delete.mockResolvedValue({} as never);
      ingestQueue.getJob
        .mockResolvedValueOnce(job1 as never)
        .mockResolvedValueOnce(job2 as never);

      await expect(service.deleteWithEmbeddings('pending-1')).resolves.toEqual(
        clicked,
      );

      expect(redisClient.set).toHaveBeenCalledWith(
        crawlCancelledKey('crawl-1'),
        '1',
        { EX: expect.any(Number) },
      );
      expect(documentsRepository.findByCrawlIdAndStatuses).toHaveBeenCalledWith(
        'crawl-1',
        [ResourceStatus.pending, ResourceStatus.processing],
      );
      expect(job1.remove).toHaveBeenCalled();
      expect(job2.remove).toHaveBeenCalled();
      expect(documentsRepository.delete).toHaveBeenCalledWith('pending-1');
      expect(documentsRepository.delete).toHaveBeenCalledWith('pending-2');
    });
  });

  describe('deleteChatNamespace', () => {
    it('removes ingest jobs, deletes text objects, then the chat embedding namespace', async () => {
      documentsRepository.findByChatId.mockResolvedValue([
        { id: 'text-1', type: 'text' },
        { id: 'web-1', type: 'website' },
      ] as never);
      objectStorage.deleteFile.mockResolvedValue(undefined);
      vectorStoreService.deleteDocumentsByNamespace.mockResolvedValue(
        undefined as never,
      );
      const job = { remove: jest.fn().mockResolvedValue(undefined) };
      ingestQueue.getJob.mockResolvedValue(job as never);

      await service.deleteChatNamespace('chat-1');

      expect(ingestQueue.getJob).toHaveBeenCalledWith(ingestJobId('text-1'));
      expect(ingestQueue.getJob).toHaveBeenCalledWith(ingestJobId('web-1'));
      expect(job.remove).toHaveBeenCalledTimes(2);
      expect(objectStorage.deleteFile).toHaveBeenCalledWith(
        'resources/chat-1/text-1.md',
      );
      expect(objectStorage.deleteFile).toHaveBeenCalledTimes(1);
      expect(
        vectorStoreService.deleteDocumentsByNamespace,
      ).toHaveBeenCalledWith('chat-1');
    });
  });
});
