import { TestBed } from '@automock/jest';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { ResourceStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { ChunkingService } from '@src/infra/chunking/chunking.service';
import { CrawlerService } from '@src/infra/crawler/crawler.service';
import { VectorStoreService } from '@src/infra/vector-store/vector-store.service';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService, PermanentIngestError } from './documents.service';
import { INGEST_QUEUE } from './ingest-job';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentsRepository: jest.Mocked<DocumentsRepository>;
  let ingestQueue: jest.Mocked<Queue>;
  let crawlerService: jest.Mocked<CrawlerService>;
  let chunkingService: jest.Mocked<ChunkingService>;
  let vectorStoreService: jest.Mocked<VectorStoreService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(DocumentsService).compile();
    service = unit;
    documentsRepository = unitRef.get(DocumentsRepository);
    ingestQueue = unitRef.get(getQueueToken(INGEST_QUEUE));
    crawlerService = unitRef.get(CrawlerService);
    chunkingService = unitRef.get(ChunkingService);
    vectorStoreService = unitRef.get(VectorStoreService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('process', () => {
    it('scrapes, embeds, and marks the resource ready', async () => {
      documentsRepository.findById
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.pending,
        } as never)
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.processing,
        } as never);
      crawlerService.scrape.mockResolvedValue([
        {
          url: 'https://docs.example.com',
          title: 'Docs',
          html: '<p>hello</p>',
        },
      ]);
      chunkingService.generateDocsFromHtml.mockResolvedValue([
        { content: 'hello', namespace: 'chat-1', metadata: {} },
      ]);
      vectorStoreService.addDocuments.mockResolvedValue(['emb-1']);

      await service.process({
        resourceId: 'resource-1',
        chatId: 'chat-1',
        url: 'https://docs.example.com',
      });

      expect(crawlerService.scrape).toHaveBeenCalledWith({
        urls: ['https://docs.example.com'],
      });
      expect(documentsRepository.update).toHaveBeenLastCalledWith('resource-1', {
        status: ResourceStatus.ready,
        embeddingIds: ['emb-1'],
        error: null,
      });
    });

    it('skips deleted and already-ready resources', async () => {
      documentsRepository.findById.mockResolvedValueOnce(null);
      await service.process({
        resourceId: 'missing',
        chatId: 'chat-1',
        url: 'https://docs.example.com',
      });
      expect(crawlerService.scrape).not.toHaveBeenCalled();

      documentsRepository.findById.mockResolvedValueOnce({
        id: 'resource-1',
        status: ResourceStatus.ready,
      } as never);
      await service.process({
        resourceId: 'resource-1',
        chatId: 'chat-1',
        url: 'https://docs.example.com',
      });
      expect(crawlerService.scrape).not.toHaveBeenCalled();
    });

    it('treats empty scrapes as permanent failures', async () => {
      documentsRepository.findById.mockResolvedValue({
        id: 'resource-1',
        status: ResourceStatus.pending,
      } as never);
      crawlerService.scrape.mockResolvedValue([]);

      await expect(
        service.process({
          resourceId: 'resource-1',
          chatId: 'chat-1',
          url: 'https://docs.example.com',
        }),
      ).rejects.toBeInstanceOf(PermanentIngestError);
    });
  });
});
