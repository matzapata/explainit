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
    jest.clearAllMocks();
    env.get.mockImplementation((key: string) => {
      if (key === 'CORS_ORIGIN') return DASHBOARD_ORIGIN;
      if (key === 'NODE_ENV') return 'test';
      return undefined as never;
    });
  });

  describe('getChatsByOwner', () => {
    it('should require authentication to list chats', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.getChatsByOwner,
      );
      const guard = new guards[0]();

      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should return the owner chats without resources', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const chat = {
        id: 'id',
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
      chatsService.findManyByOwner.mockResolvedValue([chat]);

      const result = await chatController.getChatsByOwner(authUser);

      expect(chatsService.findManyByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).not.toHaveBeenCalled();
      expect(documentsService.findByChatId).not.toHaveBeenCalled();
      expect(result).toEqual([chat]);
    });

    it('should create an example chat for the user if none exists', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const chat = {
        id: 'id',
        name: 'Lorem Ipsum',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        hostOrigins: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        ownerId: 'id',
      };
      chatsService.findManyByOwner.mockResolvedValue([]);
      chatsService.create.mockResolvedValue(chat);

      const result = await chatController.getChatsByOwner(authUser);

      expect(chatsService.findManyByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).toHaveBeenCalledWith(authUser.id, {});
      expect(result).toEqual([chat]);
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
      const data = { name: 'name', color: 'green' as const };
      const chat = {
        id: 'id',
        name: 'name',
        color: 'green' as const,
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
      chatsService.update.mockResolvedValue(chat);

      const result = await chatController.updateChat(authUser, data, chat.id);

      expect(chatsService.update).toHaveBeenCalledWith(
        authUser.id,
        chat.id,
        data,
      );
      expect(result).toEqual(chat);
    });

    it('normalizes hostOrigins to canonical origins', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const data = {
        hostOrigins: [
          'https://www.demo.com/docs',
          'https://docs.demo.com/',
          'https://demo.com/path',
        ],
      };
      const chat = {
        id: 'id',
        name: 'name',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        hostOrigins: [
          'https://www.demo.com',
          'https://docs.demo.com',
          'https://demo.com',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        ownerId: 'ownerId',
      };
      chatsService.update.mockResolvedValue(chat);

      const result = await chatController.updateChat(authUser, data, chat.id);

      expect(chatsService.update).toHaveBeenCalledWith(authUser.id, chat.id, {
        hostOrigins: [
          'https://www.demo.com',
          'https://docs.demo.com',
          'https://demo.com',
        ],
      });
      expect(result).toEqual(chat);
    });

    it('should allow any authenticated user to publish a chat', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const data = { published: true };
      const chat = {
        id: 'id',
        name: 'name',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        hostOrigins: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
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

    it('returns a public chat by id when Origin matches hostOrigins', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        hostOrigins: [HOST_ORIGIN],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
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
        color: 'blue' as const,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        hostOrigins: [HOST_ORIGIN],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
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

    it('allows a listed Host origin', async () => {
      const extraOrigin = 'https://www.demo.com';
      const chat = {
        id: 'id',
        name: 'name',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        hostOrigins: [HOST_ORIGIN, extraOrigin],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        ownerId: 'ownerId',
      };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(
          chat.id,
          visitorReq({ headers: { origin: extraOrigin } }),
        ),
      ).resolves.toEqual(chat);
    });

    it('rejects an Origin not in hostOrigins', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        hostOrigins: ['https://www.demo.com'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        ownerId: 'ownerId',
      };
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(
          chat.id,
          visitorReq({ headers: { origin: 'https://other.example.com' } }),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows dashboard Origin', async () => {
      const chat = {
        id: 'id',
        name: 'name',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: true,
        conversationStarters: [],
        hostOrigins: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
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
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.getChat(chat.id, visitorReq()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns an unpublished chat when there is a current user and dashboard Origin', async () => {
      const chat = {
        id: 'id',
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

    it('includes resources when the current user owns the chat', async () => {
      const chat = {
        id: 'id',
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
      const resources = [
        {
          id: 'resource-1',
          type: 'website',
          data: 'https://docs.example.com',
          status: ResourceStatus.ready,
          error: null,
          embeddingIds: ['emb-1'],
          createdAt: new Date(),
          chatId: chat.id,
        },
      ];
      const currentUser = { id: 'ownerId', email: 'email', isAdmin: false };
      chatsService.findFirstById.mockResolvedValue(chat);
      documentsService.findByChatId.mockResolvedValue(resources);

      await expect(
        chatController.getChat(
          chat.id,
          visitorReq({
            currentUser,
            headers: { origin: DASHBOARD_ORIGIN },
          }),
        ),
      ).resolves.toEqual({ ...chat, resources });
      expect(documentsService.findByChatId).toHaveBeenCalledWith(chat.id);
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

    it('requires authentication to delete a chat', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.deleteChat,
      );
      expect(new guards[0]()).toBeInstanceOf(AuthGuard);
    });

    it('lists chats for the admin owner', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: true };
      const chats = [
        {
          id: 'id',
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
        color: 'blue' as const,
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        hostOrigins: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        ownerId: authUser.id,
      };
      chatsService.create.mockResolvedValue(chat);

      await expect(chatController.createChat(authUser, data)).resolves.toEqual(
        chat,
      );
      expect(chatsService.create).toHaveBeenCalledWith(authUser.id, data);
    });

    it('lets the owner delete a chat and its embedding namespace', async () => {
      const owner = { id: 'ownerId', email: 'email', isAdmin: false };
      const chat = {
        id: 'chat-1',
        name: 'Docs',
        color: 'blue' as const,
        description: null,
        points: 0,
        published: false,
        conversationStarters: [],
        hostOrigins: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        ownerId: owner.id,
      };
      chatsService.findFirstById.mockResolvedValue(chat);
      documentsService.deleteChatNamespace.mockResolvedValue(undefined);
      chatsService.delete.mockResolvedValue(chat);

      await expect(chatController.deleteChat(owner, chat.id)).resolves.toEqual(
        chat,
      );
      expect(documentsService.deleteChatNamespace).toHaveBeenCalledWith(
        chat.id,
      );
      expect(chatsService.delete).toHaveBeenCalledWith(chat.id);
    });

    it('lets an admin delete another owner chat', async () => {
      const admin = { id: 'admin', email: 'email', isAdmin: true };
      const chat = {
        id: 'chat-1',
        name: 'Docs',
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
      chatsService.findFirstById.mockResolvedValue(chat);
      documentsService.deleteChatNamespace.mockResolvedValue(undefined);
      chatsService.delete.mockResolvedValue(chat);

      await expect(chatController.deleteChat(admin, chat.id)).resolves.toEqual(
        chat,
      );
      expect(chatsService.delete).toHaveBeenCalledWith(chat.id);
    });

    it('does not let a non-owner delete a chat', async () => {
      const other = { id: 'other', email: 'email', isAdmin: false };
      const chat = {
        id: 'chat-1',
        name: 'Docs',
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
      chatsService.findFirstById.mockResolvedValue(chat);

      await expect(
        chatController.deleteChat(other, chat.id),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(documentsService.deleteChatNamespace).not.toHaveBeenCalled();
      expect(chatsService.delete).not.toHaveBeenCalled();
    });

    it('throws when deleting a missing chat', async () => {
      const owner = { id: 'ownerId', email: 'email', isAdmin: false };
      chatsService.findFirstById.mockResolvedValue(null);

      await expect(
        chatController.deleteChat(owner, 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(documentsService.deleteChatNamespace).not.toHaveBeenCalled();
      expect(chatsService.delete).not.toHaveBeenCalled();
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
      color: 'blue' as const,
      description: null,
      points: 0,
      published: true,
      conversationStarters: [],
      hostOrigins: [HOST_ORIGIN],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: null,
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
