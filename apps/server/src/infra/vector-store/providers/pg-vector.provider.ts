import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { VectorStoreProvider, EmbeddingHit } from './vector-store.provider';
import { PrismaService } from '@src/infra/database/prisma.service';
import { EmbeddingsService } from '@src/infra/llm/embeddings.service';

@Injectable()
export class PgVectorProvider implements VectorStoreProvider {
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
  ): Promise<string[]> {
    documents = documents.filter((d) => d.content.length > 0);

    const ids: string[] = [];
    for (const doc of documents) {
      const embedding = await this.embeddings.generateEmbeddings(doc.content);
      const id = randomUUID();
      const namespace = doc.namespace ?? 'public';

      await this.prisma.$executeRaw`
        INSERT INTO "Embedding" (id, content, namespace, metadata, embedding)
        VALUES (
          ${id}::uuid,
          ${doc.content},
          ${namespace},
          ${JSON.stringify({ ...doc.metadata })}::jsonb,
          ${toSqlVector(embedding)}::vector
        )
      `;

      ids.push(id);
    }

    return ids;
  }

  async deleteDocuments(ids: string[]) {
    if (ids.length === 0) return;
    await this.prisma.embedding.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async similaritySearch(
    query: string,
    k: number,
    namespace: string,
  ): Promise<EmbeddingHit[]> {
    if (query.trim().length === 0) return [];
    namespace = namespace ?? 'public';
    const limit = Math.max(1, Math.trunc(Number(k) || 5));

    const embedding = await this.embeddings.generateEmbeddings(query);
    const vector = toSqlVector(embedding);

    return this.prisma.$queryRaw<EmbeddingHit[]>`
      SELECT
        id::text AS id,
        content,
        namespace,
        metadata,
        1 - (embedding <=> ${vector}::vector) AS similarity
      FROM "Embedding"
      WHERE namespace = ${namespace}
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit}
    `;
  }
}

function toSqlVector(values: number[]): string {
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    values.some((n) => typeof n !== 'number' || !Number.isFinite(n))
  ) {
    throw new Error('Invalid embedding vector');
  }
  return `[${values.join(',')}]`;
}
