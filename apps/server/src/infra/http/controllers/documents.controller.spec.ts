import { TestBed } from '@automock/jest';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { DocumentsController } from './documents.controller';
import { ChatsService } from '@src/modules/chat/chat.service';
import { DocumentsService } from '@src/modules/documents/documents.service';
import { ResourceStatus } from '@prisma/client';

describe('DocumentsController', () => {
  let documentsController: DocumentsController;
  let chatsService: jest.Mocked<ChatsService>;
  let documentsService: jest.Mocked<DocumentsService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(DocumentsController).compile();
    documentsController = unit;
    chatsService = unitRef.get(ChatsService);
    documentsService = unitRef.get(DocumentsService);
  });

  describe('loadWebResource', () => {
    it('enqueues website urls after checking ownership', async () => {
      const authUser = { id: 'ownerId', email: 'email', isAdmin: false };
      const chat = {
        id: 'chatId',
        name: 'name',
        logo: 'logo',
        url: 'url',
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
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
      chatsService.findFirstById.mockResolvedValue(chat);
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
  });
});
