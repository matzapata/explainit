import { TestBed } from '@automock/jest';
import { AuthGuard } from '../users/guards/auth.guard';
import { ChatController } from './chat.controller';
import { RagService } from './services/rag.service';
import { ChatsService } from './services/chat.service';
import { StorageService } from '@src/infrastructure/storage/storage.service';
import { ResourcesService } from './services/resources.service';

describe('ChatController', () => {
  // Declare the unit under test
  let chatController: ChatController;

  // Declare the mocks
  let ragService: jest.Mocked<RagService>;
  let chatsService: jest.Mocked<ChatsService>;
  let storageService: jest.Mocked<StorageService>;
  let resourcesService: jest.Mocked<ResourcesService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ChatController).compile();

    // Assign the unit under test
    chatController = unit;

    // Retrieve mocks from the unit reference and assign
    ragService = unitRef.get(RagService);
    chatsService = unitRef.get(ChatsService);
    storageService = unitRef.get(StorageService);
    resourcesService = unitRef.get(ResourcesService);
  });

  describe('getChatByOwner', () => {
    it('should require authentication to get a chat', () => {
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.getChatByOwner,
      );
      const guard = new guards[0]();

      // Assert
      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should return the chat and its resources', async () => {
      // Arrange
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
          embeddingIds: ['embedding-id'],
          createdAt: new Date(),
          chatId: 'chatId',
        },
      ];
      chatsService.findFirstByOwner.mockResolvedValue(chat);
      resourcesService.findByChatId.mockResolvedValue(resources);

      // Act
      const result = await chatController.getChatByOwner(authUser);

      // Assert
      expect(chatsService.findFirstByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).not.toHaveBeenCalled();
      expect(resourcesService.findByChatId).toHaveBeenCalledWith(chat.id);
      expect(result).toEqual({
        ...chat,
        logo: expect.stringContaining(chat.logo),
        resources,
      });
    });

    it('should create an example chat for the user if none exists', async () => {
      // Arrange
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
      resourcesService.findByChatId.mockResolvedValue(resources);

      // Act
      const result = await chatController.getChatByOwner(authUser);

      // Assert
      expect(chatsService.findFirstByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).toHaveBeenCalledWith(authUser.id, {});
      expect(resourcesService.findByChatId).toHaveBeenCalledWith(chat.id);
      expect(result).toEqual({
        ...chat,
        logo: expect.stringContaining(chat.logo),
        resources,
      });
    });
  });

  describe('updateChat', () => {
    it('should require authentication to update a chat', () => {
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.updateChat,
      );
      const guard = new guards[0]();

      // Assert
      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should update the chat', async () => {
      // Arrange
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

      // Act
      const result = await chatController.updateChat(authUser, data, chat.id);

      // Assert
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
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        ChatController.prototype.updateChatLogo,
      );
      const guard = new guards[0]();

      // Assert
      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should update the chat logo', async () => {
      // Arrange
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
      storageService.resizeImage.mockResolvedValue(Buffer.from('resized'));
      storageService.uploadFile.mockResolvedValue(undefined);
      storageService.deleteFile.mockResolvedValue(undefined);
      storageService.getFileUrl.mockResolvedValue(
        'https://cdn.example/logo.webp',
      );
      chatsService.update.mockResolvedValue({
        ...chat,
        logo: 'https://cdn.example/logo.webp',
      });

      // Act
      const result = await chatController.updateChatLogo(
        authUser,
        file,
        chat.id,
      );

      // Assert
      expect(chatsService.findFirstById).toHaveBeenCalledWith(chat.id);
      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(chatsService.update).toHaveBeenCalledWith(authUser.id, chat.id, {
        logo: 'https://cdn.example/logo.webp',
      });
      expect(result.logo).toContain('https://cdn.example/logo.webp');
    });
  });
});
