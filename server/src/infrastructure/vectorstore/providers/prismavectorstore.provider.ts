import { Injectable } from '@nestjs/common';
import { VectorStoreProvider } from './vectorstore.provider';
import { PrismaService } from '@src/database/prisma.service';
import { EmbeddingsService } from '@src/infrastructure/embeddings/embeddings.service';
import { Embedding } from '@prisma/client';

@Injectable()
export class PrismaVectorStoreProvider implements VectorStoreProvider {
  constructor(
    private readonly embeddings: EmbeddingsService,
    private readonly prisma: PrismaService,
  ) {}

  async addDocuments(
    documents: {
      content: string;
      namespace: string;
      metadata: Record<string, any>;
    }[],
  ): Promise<Embedding['id'][]> {
    // returns ids of the added documents
    documents = documents.filter((d) => d.content.length > 0);

    const ids: Embedding['id'][] = [];
    for (const doc of documents) {
      const embedding = await this.embeddings.generateEmbeddings(doc.content);

      const record = await this.prisma.embedding.create({
        data: {
          content: doc.content,
          namespace: doc.namespace ?? 'public',
          metadata: { ...doc.metadata },
        },
      });

      // Add the embedding
      await this.prisma.$executeRaw`
          UPDATE "Embedding"
          SET embedding = ${embedding}::vector
          WHERE id = ${record.id}
      `;

      ids.push(record.id);
    }

    return ids;
  }

  async deleteDocuments(ids: Embedding['id'][]) {
    await this.prisma.embedding.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async similaritySearch(
    query: string,
    k: number,
    namespace: string,
  ): Promise<Array<Embedding & { similarity: number }>> {
    if (query.trim().length === 0) return [];
    namespace = namespace ?? 'public';
    k = k ?? 5;

    const embedding = await this.embeddings.generateEmbeddings(query);
    const vectorQuery = `[${embedding.join(',')}]`;
    const docs = await this.prisma.$queryRaw`
      SELECT
        id,
        "content",
        "metadata",
        "namespace",
        1 - (embedding <=> ${vectorQuery}::vector) as similarity
      FROM "Embedding"
      WHERE 1 - (embedding <=> ${vectorQuery}::vector) > .5
      AND namespace = ${namespace}
      ORDER BY  similarity DESC
      LIMIT ${k};
    `;

    return docs as Array<Embedding & { similarity: number }>;
  }
}
