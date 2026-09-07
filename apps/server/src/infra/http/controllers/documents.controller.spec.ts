import { TestBed } from '@automock/jest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { CrawlerService } from '@src/infra/crawler/crawler.service';
import { DocumentsController } from './documents.controller';
import { ChatsService } from '@src/modules/chat/chat.service';
import { DocumentsService } from '@src/modules/documents/documents.service';
import { ResourceStatus } from '@prisma/client';

describe('DocumentsController', () => {
  let documentsController: DocumentsController;
  let chatsService: jest.Mocked<ChatsService>;
  let documentsService: jest.Mocked<DocumentsService>;
  let crawlerService: jest.Mocked<CrawlerService>;

  const authUser = { id: 'ownerId', email: 'email', isAdmin: false };
  const chat = {
    id: 'chatId',
    name: 'name',
    description: null,
    points: 0,
    published: false,
    conversationStarters: [],
    hostOrigins: [],
    createdAt: new Date(),
    ownerId: 'ownerId',
  };

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(DocumentsController).compile();
    documentsController = unit;
    chatsService = unitRef.get(ChatsService);
    documentsService = unitRef.get(DocumentsService);
    crawlerService = unitRef.get(CrawlerService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    chatsService.findFirstById.mockResolvedValue(chat);
  });

  it('requires authentication on mutating routes', () => {
    for (const handler of [
      DocumentsController.prototype.loadWebResource,
      DocumentsController.prototype.loadTextResource,
      DocumentsController.prototype.inspectWebResource,
      DocumentsController.prototype.deleteResourcesFromChat,
    ]) {
      const guards = Reflect.getMetadata('__guards__', handler);
      expect(new guards[0]()).toBeInstanceOf(AuthGuard);
    }
  });

  describe('loadWebResource', () => {
    it('enqueues website urls after checking ownership', async () => {
      const pending = [
        {
          id: 'resource-1',
          type: 'website',
          data: 'https://docs.example.com',
          status: ResourceStatus.pending,
          error: null,
          embeddingIds: [],
          createdAt: new Date(),
          chatId: chat.id,
        },
      ];
      documentsService.enqueueWebsiteUrls.mockResolvedValue(pending);

      const result = await documentsController.loadWebResource(
        authUser,
        { urls: ['https://docs.example.com'] },
        chat.id,
      );

      expect(documentsService.enqueueWebsiteUrls).toHaveBeenCalledWith(
        chat.id,
        ['https://docs.example.com'],
      );
      expect(result).toEqual(pending);
    });

    it('rejects when the chat is missing or owned by someone else', async () => {
      chatsService.findFirstById.mockResolvedValueOnce(null);
      await expect(
        documentsController.loadWebResource(
          authUser,
          { urls: ['https://docs.example.com'] },
          'missing',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      chatsService.findFirstById.mockResolvedValueOnce({
        ...chat,
        ownerId: 'other',
      });
      await expect(
        documentsController.loadWebResource(
          authUser,
          { urls: ['https://docs.example.com'] },
          chat.id,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('loadTextResource', () => {
    it('creates a text resource after checking ownership', async () => {
      const created = {
        id: 'resource-1',
        type: 'text',
        data: 'Notes',
        status: ResourceStatus.ready,
        error: null,
        embeddingIds: ['emb-1'],
        createdAt: new Date(),
        chatId: chat.id,
      };
      documentsService.createTextResource.mockResolvedValue(created);

      const result = await documentsController.loadTextResource(
        authUser,
        { text: 'hello', source: 'manual', title: 'Notes' },
        chat.id,
      );

      expect(documentsService.createTextResource).toHaveBeenCalledWith(
        chat.id,
        { text: 'hello', source: 'manual', title: 'Notes' },
      );
      expect(result).toEqual([created]);
    });
  });

  describe('inspectWebResource', () => {
    it('returns in-domain urls that are not already ingested', async () => {
      crawlerService.inspect.mockResolvedValue([
        'https://docs.example.com/a',
        'https://docs.example.com/b',
      ]);
      documentsService.findByChatId.mockResolvedValue([
        { data: 'https://docs.example.com/a' } as never,
      ]);

      const result = await documentsController.inspectWebResource(
        authUser,
        { url: 'https://docs.example.com' },
        chat.id,
      );

      expect(crawlerService.inspect).toHaveBeenCalledWith({
        url: 'https://docs.example.com',
      });
      expect(result).toEqual({ urls: ['https://docs.example.com/b'] });
    });
  });

  describe('deleteResourcesFromChat', () => {
    it('deletes the resource and its embeddings', async () => {
      const resource = {
        id: 'resource-1',
        type: 'website',
        data: 'https://docs.example.com',
        status: ResourceStatus.ready,
        error: null,
        embeddingIds: ['emb-1'],
        createdAt: new Date(),
        chatId: chat.id,
      };
      documentsService.deleteWithEmbeddings.mockResolvedValue(resource);

      await expect(
        documentsController.deleteResourcesFromChat('resource-1'),
      ).resolves.toEqual(resource);
      expect(documentsService.deleteWithEmbeddings).toHaveBeenCalledWith(
        'resource-1',
      );
    });

    it('throws when the resource is missing', async () => {
      documentsService.deleteWithEmbeddings.mockResolvedValue(null);

      await expect(
        documentsController.deleteResourcesFromChat('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
