import { Prisma } from '@prisma/client';

export type EmbeddingHit = {
  id: string;
  content: string;
  namespace: string;
  metadata: Prisma.JsonValue;
  similarity: number;
};

export enum DocumentLoader {
  github = 'github',
  gitbook = 'gitbook',
  website = 'website',
  pdf = 'application/pdf',
  text = 'text/plain',
  json = 'application/json',
  csv = 'text/csv',
}

export abstract class VectorStoreProvider {
  abstract similaritySearch(
    query: string,
    k: number,
    namespace: string,
  ): Promise<EmbeddingHit[]>;

  abstract addDocuments(
    documents: {
      content: string;
      namespace: string;
      metadata: Record<string, any>;
    }[],
  ): Promise<string[]>;

  abstract deleteDocuments(ids: string[]): Promise<void>;
}
