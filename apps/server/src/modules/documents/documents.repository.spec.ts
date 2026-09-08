import type { PrismaService } from '@src/infra/database/prisma.service';
import { DocumentsRepository } from './documents.repository';

describe('DocumentsRepository', () => {
  const prisma = {
    chatResource: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const repo = new DocumentsRepository(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('looks up URLs case-insensitively within a chat', async () => {
    await repo.findByUrl('chat-1', 'https://Docs.Example.com');

    expect(prisma.chatResource.findFirst).toHaveBeenCalledWith({
      where: {
        chatId: 'chat-1',
        data: {
          equals: 'https://Docs.Example.com',
          mode: 'insensitive',
        },
      },
    });
  });
});
