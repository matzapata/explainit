import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { PoolConfig } from 'pg';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { Document } from 'langchain/document';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { VectorStoreRetriever } from 'langchain/vectorstores/base';
import { Callbacks } from 'langchain/callbacks';
import { Metadata } from 'langchain/vectorstores/singlestore';
import { MimeType, VectorStoreProvider } from './vectorstore.provider';

@Injectable()
export class PgVectorStoreProvider implements VectorStoreProvider {
  private vectorStore: PGVectorStore;
  private embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  // on module init create the connection
  async onModuleInit() {
    // TODO: Refactor to use prisma service
    this.vectorStore = await PGVectorStore.initialize(this.embeddings, {
      postgresConnectionOptions: {
        type: 'postgres',
        connectionString: this.configService.get('POSTGRES_URL'),
      } as PoolConfig,
      tableName: 'documents',
      columns: {
        idColumnName: 'id',
        vectorColumnName: 'embedding',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
      },
    });
  }
  // on module destroy close the connection
  async onModuleDestroy() {
    await this.vectorStore.end();
  }

  public getRetriever(
    k?: number,
    filter?: Metadata,
    callbacks?: Callbacks,
    tags?: string[],
    metadata?: Record<string, unknown>,
    verbose?: boolean,
  ): VectorStoreRetriever {
    return this.vectorStore.asRetriever(
      k,
      filter,
      callbacks,
      tags,
      metadata,
      verbose,
    );
  }

  public similaritySearch(query: string, k: number, filter?: any) {
    return this.vectorStore.similaritySearch(query, k, filter);
  }

  public async loadDocuments(
    documents: {
      pageContent: string;
      metadata: Record<string, any>;
    }[],
  ): Promise<string[]> {
    // returns ids of the added documents
    return this.addDocuments(documents);
  }

  public async deleteDocuments(ids: string[]) {
    return this.vectorStore.delete({ ids });
  }

  public async loadFile(
    filePathOrBlob: string | Blob,
    mimetype: MimeType,
    metadata?: Record<string, any>,
  ) {
    // Load file content
    let contents: Document<Record<string, any>>[] = [];
    switch (mimetype) {
      case MimeType.text: {
        const loader = new TextLoader(filePathOrBlob);
        contents = await loader.load();
        break;
      }
      case MimeType.json: {
        const loader = new JSONLoader(filePathOrBlob);
        contents = await loader.load();
        break;
      }
      case MimeType.pdf: {
        const loader = new PDFLoader(filePathOrBlob);
        contents = await loader.load();
        break;
      }
      case MimeType.csv: {
        const loader = new CSVLoader(filePathOrBlob);
        contents = await loader.load();
        break;
      }
      default:
        throw new Error('Unsupported file type' + mimetype);
    }

    // merge metadata
    const documents = contents.map((d) => ({
      pageContent: d.pageContent,
      metadata: {
        ...d.metadata,
        ...metadata,
      },
    }));

    return this.loadDocuments(documents);
  }

  // private methods:

  // Creates the embeddings for the documents and adds them to the vector store
  private async addDocuments(documents: Document[]): Promise<string[]> {
    const texts = documents.map(({ pageContent }) => pageContent);

    return this.addVectors(
      await this.embeddings.embedDocuments(texts),
      documents,
    );
  }

  // Adds the vectors to the vector store
  private async addVectors(
    vectors: number[][],
    documents: Document[],
  ): Promise<string[]> {
    const rows = [];

    for (let i = 0; i < vectors.length; i += 1) {
      const values = [];
      const embedding = vectors[i];
      const embeddingString = `[${embedding.join(',')}]`;
      values.push(
        documents[i].pageContent.replace(/\0/g, ''),
        embeddingString.replace(/\0/g, ''),
        documents[i].metadata,
      );

      rows.push(values);
    }

    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const insertQuery = await this.buildInsertQuery(chunk);
      const flatValues = chunk.flat();
      try {
        const res = await this.vectorStore.client.query(
          insertQuery,
          flatValues,
        );
        return res.rows.map((row) => row.id);
      } catch (e) {
        throw new Error(`Error inserting: ${(e as Error).message}`);
      }
    }
  }

  private generatePlaceholderForRowAt(
    index: number,
    numOfColumns: number,
  ): string {
    const placeholders = [];
    for (let i = 0; i < numOfColumns; i += 1) {
      placeholders.push(`$${index * numOfColumns + i + 1}`);
    }
    return `(${placeholders.join(', ')})`;
  }

  private async buildInsertQuery(rows: (string | Record<string, unknown>)[][]) {
    const columns = ['content', 'embedding', 'metadata'];

    // Check if we have added ids to the rows.
    if (rows.length !== 0 && columns.length === rows[0].length - 1) {
      columns.push('id');
    }

    const valuesPlaceholders = rows
      .map((_, j) => this.generatePlaceholderForRowAt(j, columns.length))
      .join(', ');

    const text = `
      INSERT INTO ${'documents'}(
        ${columns.map((column) => `"${column}"`).join(', ')}
      )
      VALUES ${valuesPlaceholders} RETURNING id
    `;
    return text;
  }
}
