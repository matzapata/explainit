import { PrismaService } from '@src/infra/database/prisma.service';
import { ChatRepository } from './chat.repository';

describe('ChatRepository', () => {
  const prisma = {
    chat: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const repo = new ChatRepository(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes updates to the owner', async () => {
    prisma.chat.update.mockResolvedValue({ id: 'chat-1' });

    await repo.update('owner-1', 'chat-1', { name: 'Docs' });

    expect(prisma.chat.update).toHaveBeenCalledWith({
      where: { id: 'chat-1', ownerId: 'owner-1' },
      data: { name: 'Docs', updatedAt: expect.any(Date) },
    });
  });

  it('increments points by id', async () => {
    await repo.incrementPoints('chat-1');

    expect(prisma.chat.update).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
      data: { points: { increment: 1 }, lastUsedAt: expect.any(Date) },
    });
  });

  it('lists owner chats with the most recently updated first', async () => {
    await repo.findManyByOwner('owner-1');

    expect(prisma.chat.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'owner-1' },
      orderBy: { updatedAt: 'desc' },
    });
  });
});
