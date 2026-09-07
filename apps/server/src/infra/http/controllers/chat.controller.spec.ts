import { TestBed } from '@automock/jest';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { AdminGuard } from '@src/infra/http/guards/admin.guard';
import { RATE_LIMIT_OPTIONS } from '@src/infra/http/decorators/rate-limit.decorator';
import { ChatController } from './chat.controller';
import { ChatsService } from '@src/modules/chat/chat.service';
import { ConversationService } from '@src/modules/chat/conversation.service';
import { DocumentsService } from '@src/modules/documents/documents.service';
import { EnvService } from '@src/infra/env/env.service';
import { ResourceStatus } from '@prisma/client';
import { MessageAgent } from '@src/modules/chat/message';

const HOST_ORIGIN = 'https://docs.example.com';
const DASHBOARD_ORIGIN = 'http://localhost:3000';

describe('ChatController', () => {
  let chatController: ChatController;
  let chatsService: jest.Mocked<ChatsService>;
  let documentsService: jest.Mocked<DocumentsService>;
  let conversationService: jest.Mocked<ConversationService>;
  let env: jest.Mocked<EnvService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ChatController).compile();
    chatController = unit;
    chatsService = unitRef.get(ChatsService);
    documentsService = unitRef.get(DocumentsService);
    conversationService = unitRef.get(ConversationService);
    env = unitRef.get(EnvService);
  });

  beforeEach(() => {
    env.get.mockImplementation((key: string) => {
      if (key === 'CORS_ORIGIN') return DASHBOARD_ORIGIN;
      if (key === 'NODE_ENV') return 'test';
      return undefined as never;
    });
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
        resources,
      });
    });

    it('should create an example chat for the user if none exists', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const chat = {
        id: 'id',
        name: 'Lorem Ipsum',
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
      const data = { name: 'name', url: 'url' };
      const chat = {
        id: 'id',
        name: 'name',
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

  describe('getChat', () => {
    const visitorReq = (overrides: Record<string, unknown> = {}) =>
      ({
        headers: { origin: HOST_ORIGIN },
        currentUser: null,
        ...overrides,
      }) as never;

    it('returns a public chat by id when Origin matches Website', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        url: `${HOST_ORIGIN}/guide`,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(chat.id, visitorReq()),
      ).resolves.toEqual(chat);
    });

    it('throws when Origin is not allowed', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        url: `${HOST_ORIGIN}/guide`,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(
          chat.id,
          visitorReq({ headers: { origin: 'https://evil.example.com' } }),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows dashboard Origin', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        url: `${HOST_ORIGIN}/guide`,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(
          chat.id,
          visitorReq({ headers: { origin: DASHBOARD_ORIGIN } }),
        ),
      ).resolves.toEqual(chat);
    });

    it('throws when the chat is missing', async () => {
      chatsService.findFirstById.mockResolvedValue(null);

      await expect(
        chatController.getChat('missing', visitorReq()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when the chat is unpublished and there is no current user', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        url: `${HOST_ORIGIN}/guide`,
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(chat.id, visitorReq()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns an unpublished chat when there is a current user and dashboard Origin', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        url: `${HOST_ORIGIN}/guide`,
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      const currentUser = { id: 'id', email: 'email', isAdmin: false };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(
          chat.id,
          visitorReq({
            currentUser,
            headers: { origin: DASHBOARD_ORIGIN },
          }),
        ),
      ).resolves.toEqual(chat);
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
    const conversationId = 'conv-1';

    const makeReq = (overrides: Record<string, unknown> = {}) => ({
      headers: { origin: HOST_ORIGIN },
      currentUser: null,
      on: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      ...overrides,
    });

    const makeRes = () => ({
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      writableEnded: false,
    });

    const publishedChat = {
      id: 'chat-1',
      name: 'name',
      url: `${HOST_ORIGIN}/guide`,
      description: null,
      points: 0,
      published: true,
      conversationStarters: [],
      createdAt: new Date(),
      ownerId: 'ownerId',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      env.get.mockImplementation((key: string) => {
        if (key === 'CORS_ORIGIN') return DASHBOARD_ORIGIN;
        if (key === 'NODE_ENV') return 'test';
        return undefined as never;
      });
      conversationService.resolveConversationId.mockResolvedValue(
        conversationId,
      );
      conversationService.persistTurn.mockResolvedValue(undefined);
    });

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

    it('increments points and streams the answer as SSE with conversationId', async () => {
      const body = {
        question: 'what is this?',
        chatHistory: [{ agent: MessageAgent.USER, message: 'hi' }],
        conversationId: 'client-conv',
      };
      const answer = {
        question: body.question,
        answer: 'a product',
        context: [],
      };
      const req = makeReq();
      const res = makeRes();
      chatsService.findFirstById.mockResolvedValue(publishedChat);
      chatsService.answer.mockImplementation(
        async (_q, _h, _k, _ns, onToken) => {
          onToken?.('a ');
          onToken?.('product');
          return answer;
        },
      );

      await chatController.postMessage(
        body,
        publishedChat.id,
        req as never,
        res as never,
      );

      expect(chatsService.incrementPoints).toHaveBeenCalledWith(publishedChat.id);
      expect(conversationService.resolveConversationId).toHaveBeenCalledWith(
        publishedChat.id,
        'client-conv',
      );
      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Set-Cookie',
        expect.anything(),
      );
      expect(chatsService.answer).toHaveBeenCalledWith(
        body.question,
        body.chatHistory,
        4,
        publishedChat.id,
        expect.any(Function),
        expect.any(AbortSignal),
        { pageUrl: undefined, selectedText: undefined },
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
        `event: done\ndata: ${JSON.stringify({ ...answer, conversationId })}\n\n`,
      );
      expect(conversationService.persistTurn).toHaveBeenCalledWith({
        conversationId,
        chatId: publishedChat.id,
        question: body.question,
        answer: answer.answer,
        context: answer.context,
        pageUrl: undefined,
        selectedText: undefined,
      });
      expect(res.end).toHaveBeenCalled();
      expect(req.off).toHaveBeenCalled();
    });

    it('writes an error event when generation fails after the stream opens', async () => {
      const req = makeReq();
      const res = makeRes();
      chatsService.findFirstById.mockResolvedValue(publishedChat);
      chatsService.answer.mockRejectedValue(new Error('upstream down'));

      await chatController.postMessage(
        { question: 'what?', chatHistory: [] },
        publishedChat.id,
        req as never,
        res as never,
      );

      expect(res.write).toHaveBeenCalledWith(
        'event: error\ndata: {"message":"upstream down"}\n\n',
      );
      expect(conversationService.persistTurn).not.toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it('throws when the chat is missing', async () => {
      chatsService.findFirstById.mockResolvedValue(null);

      await expect(
        chatController.postMessage(
          { question: 'what?', chatHistory: [] },
          'missing',
          makeReq() as never,
          makeRes() as never,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(conversationService.resolveConversationId).not.toHaveBeenCalled();
    });

    it('throws when Origin is not allowed', async () => {
      chatsService.findFirstById.mockResolvedValue(publishedChat);

      await expect(
        chatController.postMessage(
          { question: 'what?', chatHistory: [] },
          publishedChat.id,
          makeReq({ headers: { origin: 'https://evil.example.com' } }) as never,
          makeRes() as never,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(chatsService.incrementPoints).not.toHaveBeenCalled();
    });

    it('throws when the chat is unpublished and there is no current user', async () => {
      const chat = { ...publishedChat, published: false };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.postMessage(
          { question: 'what?', chatHistory: [] },
          chat.id,
          makeReq({ currentUser: null }) as never,
          makeRes() as never,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(chatsService.incrementPoints).not.toHaveBeenCalled();
      expect(conversationService.resolveConversationId).not.toHaveBeenCalled();
    });

    it('streams successfully when the chat is unpublished and there is a current user', async () => {
      const chat = { ...publishedChat, published: false };
      const currentUser = { id: 'id', email: 'email', isAdmin: false };
      const body = { question: 'what?', chatHistory: [] };
      const answer = {
        question: body.question,
        answer: 'a product',
        context: [],
      };
      const req = makeReq({
        currentUser,
        headers: { origin: DASHBOARD_ORIGIN },
      });
      const res = makeRes();
      chatsService.findFirstById.mockResolvedValue(chat);
      chatsService.answer.mockResolvedValue(answer);

      await chatController.postMessage(
        body,
        chat.id,
        req as never,
        res as never,
      );

      expect(chatsService.answer).toHaveBeenCalled();
      expect(res.write).toHaveBeenCalledWith(
        `event: done\ndata: ${JSON.stringify({ ...answer, conversationId })}\n\n`,
      );
      expect(conversationService.persistTurn).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it('passes pageUrl and selectedText from the body to answer and persistTurn', async () => {
      const body = {
        question: 'what is this?',
        chatHistory: [],
        pageUrl: 'https://docs.example.com/docs',
        selectedText: 'highlighted passage',
      };
      const answer = {
        question: body.question,
        answer: 'a product',
        context: [],
      };
      const req = makeReq();
      const res = makeRes();
      chatsService.findFirstById.mockResolvedValue(publishedChat);
      chatsService.answer.mockResolvedValue(answer);

      await chatController.postMessage(
        body,
        publishedChat.id,
        req as never,
        res as never,
      );

      expect(chatsService.answer).toHaveBeenCalledWith(
        body.question,
        body.chatHistory,
        4,
        publishedChat.id,
        expect.any(Function),
        expect.any(AbortSignal),
        { pageUrl: body.pageUrl, selectedText: body.selectedText },
      );
      expect(conversationService.persistTurn).toHaveBeenCalledWith({
        conversationId,
        chatId: publishedChat.id,
        question: body.question,
        answer: answer.answer,
        context: answer.context,
        pageUrl: body.pageUrl,
        selectedText: body.selectedText,
      });
    });
  });
});
