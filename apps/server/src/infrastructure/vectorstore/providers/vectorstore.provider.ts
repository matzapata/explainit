import { Embedding } from '@prisma/client';

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
  ): Promise<Array<Embedding & { similarity: number }>>;

  abstract addDocuments(
    documents: {
      content: string;
      namespace: string;
      metadata: Record<string, any>;
    }[],
  ): Promise<Embedding['id'][]>;

  abstract deleteDocuments(ids: Embedding['id'][]): Promise<void>;
}
