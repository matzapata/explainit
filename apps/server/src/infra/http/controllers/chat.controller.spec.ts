import { TestBed } from '@automock/jest';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { AdminGuard } from '@src/infra/http/guards/admin.guard';
import { RATE_LIMIT_OPTIONS } from '@src/infra/http/decorators/rate-limit.decorator';
import { ChatController } from './chat.controller';
import { ChatsService } from '@src/modules/chat/chat.service';
import { ObjectStorageService } from '@src/infra/object-storage/object-storage.service';
import { DocumentsService } from '@src/modules/documents/documents.service';
import { ResourceStatus } from '@prisma/client';
import { MessageAgent } from '@src/modules/chat/message';

describe('ChatController', () => {
  let chatController: ChatController;
  let chatsService: jest.Mocked<ChatsService>;
  let objectStorage: jest.Mocked<ObjectStorageService>;
  let documentsService: jest.Mocked<DocumentsService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ChatController).compile();
    chatController = unit;
    chatsService = unitRef.get(ChatsService);
    objectStorage = unitRef.get(ObjectStorageService);
    documentsService = unitRef.get(DocumentsService);
  });

  describe('getChatByOwner', () => {
    it('should require authentication to get a chat', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.getChatByOwner,
      );
      const guard = new guards[0]();

      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should return the chat and its resources', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const chat = {
        id: 'id',
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
      const resources = [
        {
          id: 'id',
          type: 'type',
          data: 'data',
          status: ResourceStatus.ready,
          error: null,
          embeddingIds: ['embedding-id'],
          createdAt: new Date(),
          chatId: 'chatId',
        },
      ];
      chatsService.findFirstByOwner.mockResolvedValue(chat);
      documentsService.findByChatId.mockResolvedValue(resources);

      const result = await chatController.getChatByOwner(authUser);

      expect(chatsService.findFirstByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).not.toHaveBeenCalled();
      expect(documentsService.findByChatId).toHaveBeenCalledWith(chat.id);
      expect(result).toEqual({
        ...chat,
        logo: expect.stringContaining(chat.logo),
        resources,
      });
    });

    it('should create an example chat for the user if none exists', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const chat = {
        id: 'id',
        name: 'Lorem Ipsum',
        logo: 'https://lorem.com/ipsum.png',
        url: 'https://lorem.com',
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'id',
      };
      const resources = [];
      chatsService.findFirstByOwner.mockResolvedValue(null);
      chatsService.create.mockResolvedValue(chat);
      documentsService.findByChatId.mockResolvedValue(resources);

      const result = await chatController.getChatByOwner(authUser);

      expect(chatsService.findFirstByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).toHaveBeenCalledWith(authUser.id, {});
      expect(documentsService.findByChatId).toHaveBeenCalledWith(chat.id);
      expect(result).toEqual({
        ...chat,
        logo: expect.stringContaining(chat.logo),
        resources,
      });
    });
  });

  describe('updateChat', () => {
    it('should require authentication to update a chat', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.updateChat,
      );
      const guard = new guards[0]();

      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should update the chat', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const data = { name: 'name', logo: 'logo', url: 'url' };
      const chat = {
        id: 'id',
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
      chatsService.update.mockResolvedValue(chat);

      const result = await chatController.updateChat(authUser, data, chat.id);

      expect(chatsService.update).toHaveBeenCalledWith(
        authUser.id,
        chat.id,
        data,
      );
      expect(result).toEqual(chat);
    });

    it('should allow any authenticated user to publish a chat', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const data = { published: true };
      const chat = {
        id: 'id',
        name: 'name',
        logo: 'logo',
        url: 'url',
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'id',
      };
      chatsService.update.mockResolvedValue(chat);

      const result = await chatController.updateChat(authUser, data, chat.id);

      expect(chatsService.update).toHaveBeenCalledWith(
        authUser.id,
        chat.id,
        data,
      );
      expect(result).toEqual(chat);
    });
  });

  describe('updateChatLogo', () => {
    it('should require authentication to update a chat logo', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.updateChatLogo,
      );
      const guard = new guards[0]();

      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should update the chat logo', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const chat = {
        id: 'id',
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
      const file = { filename: 'filename', buffer: Buffer.from('') } as any;
      chatsService.findFirstById.mockResolvedValue(chat);
      objectStorage.resizeImage.mockResolvedValue(Buffer.from('resized'));
      objectStorage.uploadFile.mockResolvedValue(undefined);
      objectStorage.deleteFile.mockResolvedValue(undefined);
      objectStorage.getFileUrl.mockResolvedValue(
        'https://cdn.example/logo.webp',
      );
      chatsService.update.mockResolvedValue({
        ...chat,
        logo: 'https://cdn.example/logo.webp',
      });

      const result = await chatController.updateChatLogo(
        authUser,
        file,
        chat.id,
      );

      expect(chatsService.findFirstById).toHaveBeenCalledWith(chat.id);
      expect(objectStorage.uploadFile).toHaveBeenCalled();
      expect(chatsService.update).toHaveBeenCalledWith(authUser.id, chat.id, {
        logo: 'https://cdn.example/logo.webp',
      });
      expect(result.logo).toContain('https://cdn.example/logo.webp');
    });

    it('throws when the chat is missing', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      chatsService.findFirstById.mockResolvedValue(null);

      await expect(
        chatController.updateChatLogo(
          authUser,
          { filename: 'filename', buffer: Buffer.from('') } as never,
          'missing',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getChat', () => {
    it('returns a public chat by id', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        logo: 'logo',
        url: 'url',
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(chatController.getChat(chat.id)).resolves.toEqual(chat);
    });

    it('throws when the chat is missing', async () => {
      chatsService.findFirstById.mockResolvedValue(null);

      await expect(chatController.getChat('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('admin', () => {
    it('requires an admin to list and create chats', () => {
      for (const handler of [
        ChatController.prototype.getAllChatsByOwner,
        ChatController.prototype.createChat,
      ]) {
        const guards = Reflect.getMetadata('__guards__', handler);
        expect(new guards[0]()).toBeInstanceOf(AdminGuard);
      }
    });

    it('lists chats for the admin owner', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: true };
      const chats = [
        {
          id: 'id',
          name: 'name',
          logo: 'logo',
          url: 'url',
          description: null,
          points: 0,
          published: false,
          conversationStarters: [],
          createdAt: new Date(),
          ownerId: authUser.id,
        },
      ];
      chatsService.findManyByOwner.mockResolvedValue(chats);

      await expect(
        chatController.getAllChatsByOwner(authUser),
      ).resolves.toEqual(chats);
      expect(chatsService.findManyByOwner).toHaveBeenCalledWith(authUser.id);
    });

    it('creates a chat for the admin owner', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: true };
      const data = { name: 'Docs' };
      const chat = {
        id: 'id',
        name: 'Docs',
        logo: 'logo',
        url: 'url',
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: authUser.id,
      };
      chatsService.create.mockResolvedValue(chat);

      await expect(chatController.createChat(authUser, data)).resolves.toEqual(
        chat,
      );
      expect(chatsService.create).toHaveBeenCalledWith(authUser.id, data);
    });
  });

  describe('postMessage', () => {
    it('rate limits posts per chat', () => {
      const options = Reflect.getMetadata(
        RATE_LIMIT_OPTIONS,
        ChatController.prototype.postMessage,
      );

      expect(options).toMatchObject({
        keyPrefix: 'chat-messages',
        points: 10,
        duration: 60,
      });
      expect(options.getKey({ params: { id: 'chat-1' } })).toBe('chat-1');
    });

    it('increments points and streams the answer as SSE', async () => {
      const chat = {
        id: 'chat-1',
        name: 'name',
        logo: 'logo',
        url: 'url',
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      const body = {
        question: 'what is this?',
        chatHistory: [{ agent: MessageAgent.USER, message: 'hi' }],
      };
      const answer = {
        question: body.question,
        answer: 'a product',
        context: [],
      };
      const req = {
        on: jest.fn().mockReturnThis(),
        off: jest.fn().mockReturnThis(),
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        writableEnded: false,
      };
      chatsService.findFirstById.mockResolvedValue(chat);
      chatsService.answer.mockImplementation(
        async (_q, _h, _k, _ns, onToken) => {
          onToken?.('a ');
          onToken?.('product');
          return answer;
        },
      );

      await chatController.postMessage(
        body,
        chat.id,
        req as never,
        res as never,
      );

      expect(chatsService.incrementPoints).toHaveBeenCalledWith(chat.id);
      expect(chatsService.answer).toHaveBeenCalledWith(
        body.question,
        body.chatHistory,
        4,
        chat.id,
        expect.any(Function),
        expect.any(AbortSignal),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream; charset=utf-8',
      );
      expect(res.write).toHaveBeenCalledWith(
        'event: token\ndata: {"text":"a "}\n\n',
      );
      expect(res.write).toHaveBeenCalledWith(
        'event: token\ndata: {"text":"product"}\n\n',
      );
      expect(res.write).toHaveBeenCalledWith(
        `event: done\ndata: ${JSON.stringify(answer)}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
      expect(req.off).toHaveBeenCalled();
    });

    it('writes an error event when generation fails after the stream opens', async () => {
      const chat = {
        id: 'chat-1',
        name: 'name',
        logo: 'logo',
        url: 'url',
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      const req = {
        on: jest.fn().mockReturnThis(),
        off: jest.fn().mockReturnThis(),
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        writableEnded: false,
      };
      chatsService.findFirstById.mockResolvedValue(chat);
      chatsService.answer.mockRejectedValue(new Error('upstream down'));

      await chatController.postMessage(
        { question: 'what?', chatHistory: [] },
        chat.id,
        req as never,
        res as never,
      );

      expect(res.write).toHaveBeenCalledWith(
        'event: error\ndata: {"message":"upstream down"}\n\n',
      );
      expect(res.end).toHaveBeenCalled();
    });

    it('throws when the chat is missing', async () => {
      chatsService.findFirstById.mockResolvedValue(null);

      await expect(
        chatController.postMessage(
          { question: 'what?', chatHistory: [] },
          'missing',
          { on: jest.fn(), off: jest.fn() } as never,
          {} as never,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
