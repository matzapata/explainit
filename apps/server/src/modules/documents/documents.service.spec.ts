import { TestBed } from '@automock/jest';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { ResourceStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { ChunkingService } from '@src/infra/chunking/chunking.service';
import { CrawlerService } from '@src/infra/crawler/crawler.service';
import { ObjectStorageService } from '@src/infra/object-storage/object-storage.service';
import { VectorStoreService } from '@src/infra/vector-store/vector-store.service';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService, PermanentIngestError } from './documents.service';
import { INGEST_QUEUE } from './ingest-job';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => 'resource-1',
}));

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentsRepository: jest.Mocked<DocumentsRepository>;
  let ingestQueue: jest.Mocked<Queue>;
  let crawlerService: jest.Mocked<CrawlerService>;
  let chunkingService: jest.Mocked<ChunkingService>;
  let vectorStoreService: jest.Mocked<VectorStoreService>;
  let objectStorage: jest.Mocked<ObjectStorageService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(DocumentsService).compile();
    service = unit;
    documentsRepository = unitRef.get(DocumentsRepository);
    ingestQueue = unitRef.get(getQueueToken(INGEST_QUEUE));
    crawlerService = unitRef.get(CrawlerService);
    chunkingService = unitRef.get(ChunkingService);
    vectorStoreService = unitRef.get(VectorStoreService);
    objectStorage = unitRef.get(ObjectStorageService);
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
      expect(crawlerService.scrape).not.toHaveBeenCalled();
    });

    it('deletes embeddings when the resource is removed mid-ingest', async () => {
      documentsRepository.findById
        .mockResolvedValueOnce({
          id: 'resource-1',
          status: ResourceStatus.pending,
        } as never)
        .mockResolvedValueOnce(null);
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

      expect(vectorStoreService.deleteDocuments).toHaveBeenCalledWith([
        'emb-1',
      ]);
      expect(documentsRepository.update).not.toHaveBeenCalledWith(
        'resource-1',
        expect.objectContaining({ status: ResourceStatus.ready }),
      );
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
        embeddingIds: ['emb-1'],
      };
      documentsRepository.findById.mockResolvedValue(resource as never);
      documentsRepository.delete.mockResolvedValue(resource as never);

      await service.deleteWithEmbeddings('resource-1');

      expect(objectStorage.deleteFile).not.toHaveBeenCalled();
      expect(documentsRepository.delete).toHaveBeenCalledWith('resource-1');
    });
  });

  describe('deleteChatNamespace', () => {
    it('deletes text objects then the chat embedding namespace', async () => {
      documentsRepository.findByChatId.mockResolvedValue([
        { id: 'text-1', type: 'text' },
        { id: 'web-1', type: 'website' },
      ] as never);
      objectStorage.deleteFile.mockResolvedValue(undefined);
      vectorStoreService.deleteDocumentsByNamespace.mockResolvedValue(
        undefined as never,
      );

      await service.deleteChatNamespace('chat-1');

      expect(objectStorage.deleteFile).toHaveBeenCalledWith(
        'resources/chat-1/text-1.md',
      );
      expect(objectStorage.deleteFile).toHaveBeenCalledTimes(1);
      expect(vectorStoreService.deleteDocumentsByNamespace).toHaveBeenCalledWith(
        'chat-1',
      );
    });
  });
});
