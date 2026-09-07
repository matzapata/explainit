import { PrismaService } from '@src/infra/database/prisma.service';
import { EmbeddingsService } from '@src/infra/llm/embeddings.service';
import { PgVectorProvider } from './pg-vector.provider';

describe('PgVectorProvider', () => {
  const embeddings = {
    generateEmbeddings: jest.fn(),
  };
  const prisma = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    embedding: {
      deleteMany: jest.fn(),
    },
  };

  const provider = new PgVectorProvider(
    embeddings as unknown as EmbeddingsService,
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    embeddings.generateEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.embedding.deleteMany.mockResolvedValue({ count: 0 });
  });

  describe('addDocuments', () => {
    it('skips empty content and inserts remaining docs', async () => {
      const ids = await provider.addDocuments([
        { content: '', namespace: 'chat-1', metadata: { source: 'x' } },
        { content: 'hello', namespace: 'chat-1', metadata: { source: 'x' } },
      ]);

      expect(embeddings.generateEmbeddings).toHaveBeenCalledTimes(1);
      expect(embeddings.generateEmbeddings).toHaveBeenCalledWith('hello');
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(ids).toHaveLength(1);
    });

    it('rejects invalid embedding vectors', async () => {
      embeddings.generateEmbeddings.mockResolvedValueOnce([Number.NaN]);

      await expect(
        provider.addDocuments([
          { content: 'hello', namespace: 'chat-1', metadata: {} },
        ]),
      ).rejects.toThrow('Invalid embedding vector');
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe('deleteDocuments', () => {
    it('no-ops on an empty id list', async () => {
      await provider.deleteDocuments([]);
      expect(prisma.embedding.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes embeddings by id', async () => {
      await provider.deleteDocuments(['a', 'b']);
      expect(prisma.embedding.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['a', 'b'] } },
      });
    });
  });

  describe('deleteDocumentsByNamespace', () => {
    it('deletes embeddings by namespace', async () => {
      await provider.deleteDocumentsByNamespace('chat-1');
      expect(prisma.embedding.deleteMany).toHaveBeenCalledWith({
        where: { namespace: 'chat-1' },
      });
    });
  });

  describe('similaritySearch', () => {
    it('returns an empty list for a blank query', async () => {
      await expect(
        provider.similaritySearch('   ', 4, 'chat-1'),
      ).resolves.toEqual([]);
      expect(embeddings.generateEmbeddings).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('scopes the query to the given namespace', async () => {
      const hits = [
        {
          id: 'emb-1',
          content: 'chunk',
          namespace: 'chat-1',
          metadata: {},
          similarity: 0.9,
        },
      ];
      prisma.$queryRaw.mockResolvedValueOnce(hits);

      await expect(
        provider.similaritySearch('pricing', 4, 'chat-1'),
      ).resolves.toEqual(hits);

      expect(embeddings.generateEmbeddings).toHaveBeenCalledWith('pricing');
      const call = prisma.$queryRaw.mock.calls[0];
      expect(call).toEqual(
        expect.arrayContaining(['chat-1', '[0.1,0.2,0.3]', 4]),
      );
    });
  });
});
