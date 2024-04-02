import { VectorStoreRetriever } from 'langchain/vectorstores/base';
import { Callbacks } from 'langchain/callbacks';
import { Metadata } from 'langchain/vectorstores/singlestore';
import { Document } from 'langchain/document';

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
  abstract getRetriever(
    k?: number,
    filter?: Metadata,
    callbacks?: Callbacks,
    tags?: string[],
    metadata?: Record<string, unknown>,
    verbose?: boolean,
  ): VectorStoreRetriever;

  abstract similaritySearch(
    query: string,
    k: number,
    filter?: any,
  ): Promise<Document<Record<string, any>>[]>;

  abstract loadDocuments(
    documents: {
      pageContent: string;
      metadata: Record<string, any>;
    }[],
  ): Promise<number[]>;

  abstract loadSource(
    filePathOrBlob: string | Blob,
    loader: DocumentLoader,
    metadata?: Record<string, any>,
  ): Promise<number[]>;

  abstract deleteDocuments(ids: number[]): Promise<void>;
}
