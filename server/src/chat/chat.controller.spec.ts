import { TestBed } from '@automock/jest';
import { AuthGuard } from '../users/guards/auth.guard';
import { ChatController } from './chat.controller';
import { RetrievalAugmentedGenerationService } from './services/rag.service';
import { ChatsService } from './services/chat.service';
import { StorageService } from '@src/infrastructure/storage/storage.service';
import { ResourcesService } from './services/resources.service';

describe('ChatController', () => {
  // Declare the unit under test
  let chatController: ChatController;

  // Declare the mocks
  let ragService: jest.Mocked<RetrievalAugmentedGenerationService>;
  let chatsService: jest.Mocked<ChatsService>;
  let storageService: jest.Mocked<StorageService>;
  let resourcesService: jest.Mocked<ResourcesService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ChatController).compile();

    // Assign the unit under test
    chatController = unit;

    // Retrieve mocks from the unit reference and assign
    ragService = unitRef.get(RetrievalAugmentedGenerationService);
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
      const authUser = { id: 'id', email: 'email' };
      const chat = {
        id: 'id',
        name: 'name',
        logo: 'logo',
        url: 'url',
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
          embeddingIds: [1],
          createdAt: new Date(),
          chatId: 'chatId',
        },
      ];
      chatsService.findByOwner.mockResolvedValue(chat);
      resourcesService.findByChatId.mockResolvedValue(resources);

      // Act
      const result = await chatController.getChatByOwner(authUser);

      // Assert
      expect(chatsService.findByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).not.toHaveBeenCalled();
      expect(resourcesService.findByChatId).toHaveBeenCalledWith(chat.id);
      expect(result).toEqual({ ...chat, resources });
    });

    it('should create an example chat for the user if none exists', async () => {
      // Arrange
      const authUser = { id: 'id', email: 'email' };
      const chat = {
        id: 'id',
        name: 'Lorem Ipsum',
        logo: 'https://lorem.com/ipsum.png',
        url: 'https://lorem.com',
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'id',
      };
      const resources = [];
      chatsService.findByOwner.mockResolvedValue(null);
      chatsService.create.mockResolvedValue(chat);
      resourcesService.findByChatId.mockResolvedValue(resources);

      // Act
      const result = await chatController.getChatByOwner(authUser);

      // Assert
      expect(chatsService.findByOwner).toHaveBeenCalledWith(authUser.id);
      expect(chatsService.create).toHaveBeenCalledWith(authUser.id, {
        name: 'Lorem Ipsum',
        logo: 'https://lorem.com/ipsum.png',
        url: 'https://lorem.com',
        published: false,
        conversationStarters: [],
      });
      expect(resourcesService.findByChatId).toHaveBeenCalledWith(chat.id);
      expect(result).toEqual({ ...chat, resources });
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
      const authUser = { id: 'id', email: 'email' };
      const data = { name: 'name', logo: 'logo', url: 'url' };
      const chat = {
        id: 'id',
        name: 'name',
        logo: 'logo',
        url: 'url',
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      chatsService.update.mockResolvedValue(chat);

      // Act
      const result = await chatController.updateChat(authUser, data);

      // Assert
      expect(chatsService.update).toHaveBeenCalledWith(authUser.id, data);
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
      const authUser = { id: 'id', email: 'email' };
      const chat = {
        id: 'id',
        name: 'name',
        logo: 'logo',
        url: 'url',
        published: false,
        conversationStarters: [],
        createdAt: new Date(),
        ownerId: 'ownerId',
      };
      const file = { filename: 'filename' } as any;
      chatsService.findByOwner.mockResolvedValue(chat);
      storageService.uploadFile.mockResolvedValue(file);
      storageService.deleteFile.mockResolvedValue();

      // Act
      const result = await chatController.updateChatLogo(authUser, file);

      // Assert
      expect(chatsService.findByOwner).toHaveBeenCalledWith(authUser.id);
      expect(storageService.uploadFile).toHaveBeenCalledWith(file);
      expect(chatsService.update).toHaveBeenCalledWith(authUser.id, {
        logo: file.filename,
      });
      expect(result).toEqual(chat);
    });
  });
});
