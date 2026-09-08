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
    color: 'blue' as const,
    description: null,
    points: 0,
    published: false,
    conversationStarters: [],
    hostOrigins: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsedAt: null,
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
          title: null,
          status: ResourceStatus.pending,
          error: null,
          embeddingIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
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
        data: 'http://localhost:4566/explainit/resources/chatId/resource-1.md',
        title: 'Notes',
        status: ResourceStatus.ready,
        error: null,
        embeddingIds: ['emb-1'],
        createdAt: new Date(),
        updatedAt: new Date(),
        chatId: chat.id,
      };
      documentsService.createTextResource.mockResolvedValue(created);

      const result = await documentsController.loadTextResource(
        authUser,
        { text: 'hello', title: 'Notes' },
        chat.id,
      );

      expect(documentsService.createTextResource).toHaveBeenCalledWith(
        chat.id,
        { text: 'hello', title: 'Notes' },
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
    it('deletes the resource and its embeddings after checking ownership', async () => {
      const resource = {
        id: 'resource-1',
        type: 'website',
        data: 'https://docs.example.com',
        title: null,
        status: ResourceStatus.ready,
        error: null,
        embeddingIds: ['emb-1'],
        createdAt: new Date(),
        updatedAt: new Date(),
        chatId: chat.id,
      };
      documentsService.findById.mockResolvedValue(resource);
      documentsService.deleteWithEmbeddings.mockResolvedValue(resource);

      await expect(
        documentsController.deleteResourcesFromChat(
          authUser,
          chat.id,
          'resource-1',
        ),
      ).resolves.toEqual(resource);
      expect(documentsService.deleteWithEmbeddings).toHaveBeenCalledWith(
        'resource-1',
      );
    });

    it('rejects when the chat is owned by someone else', async () => {
      chatsService.findFirstById.mockResolvedValueOnce({
        ...chat,
        ownerId: 'other',
      });

      await expect(
        documentsController.deleteResourcesFromChat(
          authUser,
          chat.id,
          'resource-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(documentsService.deleteWithEmbeddings).not.toHaveBeenCalled();
    });

    it('throws when the resource is missing or belongs to another chat', async () => {
      documentsService.findById.mockResolvedValueOnce(null);
      await expect(
        documentsController.deleteResourcesFromChat(
          authUser,
          chat.id,
          'missing',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      documentsService.findById.mockResolvedValueOnce({
        id: 'resource-1',
        chatId: 'other-chat',
      } as never);
      await expect(
        documentsController.deleteResourcesFromChat(
          authUser,
          chat.id,
          'resource-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(documentsService.deleteWithEmbeddings).not.toHaveBeenCalled();
    });
  });
});
