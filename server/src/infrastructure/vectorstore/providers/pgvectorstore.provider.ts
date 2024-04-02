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
import { GitbookLoader } from 'langchain/document_loaders/web/gitbook';
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';
import { RecursiveUrlLoader } from 'langchain/document_loaders/web/recursive_url';
import { VectorStoreRetriever } from 'langchain/vectorstores/base';
import { Callbacks } from 'langchain/callbacks';
import { Metadata } from 'langchain/vectorstores/singlestore';
import { VectorStoreProvider, DocumentLoader } from './vectorstore.provider';
import { compile } from 'html-to-text';
import { BaseDocumentLoader } from 'langchain/document_loaders/base';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

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
        connectionString: this.configService.get('DATABASE_URL'),
      } as PoolConfig,
      tableName: 'Documents',
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

  getRetriever(
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

  similaritySearch(query: string, k: number, filter?: any) {
    return this.vectorStore.similaritySearch(query, k, filter);
  }

  async deleteDocuments(ids: number[]) {
    return this.vectorStore.delete({ ids: ids.map((id) => id.toString()) });
  }

  async loadDocuments(
    documents: {
      pageContent: string;
      metadata: Record<string, any>;
    }[],
  ): Promise<number[]> {
    // returns ids of the added documents
    documents = documents.filter((d) => d.pageContent.length > 0);
    const texts = documents.map(({ pageContent }) => pageContent);

    return this.addVectors(
      await this.embeddings.embedDocuments(texts),
      documents,
    );
  }

  async loadSource(
    data: string | Blob,
    docLoader: DocumentLoader,
    metadata?: Record<string, any>,
  ): Promise<number[]> {
    // validate data type
    switch (docLoader) {
      case DocumentLoader.text:
      case DocumentLoader.json:
      case DocumentLoader.pdf:
      case DocumentLoader.csv:
        if (Blob.prototype.isPrototypeOf(data)) {
          throw new Error('Data must be a blob for' + docLoader);
        }
        break;
      case DocumentLoader.gitbook:
      case DocumentLoader.github:
      case DocumentLoader.website:
        if (typeof data !== 'string') {
          throw new Error('Data must be a url for' + docLoader);
        }
        break;
      default:
        throw new Error('Unsupported file type' + docLoader);
    }

    // select correct loader and splitter
    let loader: BaseDocumentLoader;
    switch (docLoader) {
      case DocumentLoader.text: {
        loader = new TextLoader(data);
        break;
      }
      case DocumentLoader.json: {
        loader = new JSONLoader(data);
        break;
      }
      case DocumentLoader.pdf: {
        loader = new PDFLoader(data);
        break;
      }
      case DocumentLoader.csv: {
        loader = new CSVLoader(data);
        break;
      }
      case DocumentLoader.gitbook: {
        loader = new GitbookLoader(data as string);
        break;
      }
      case DocumentLoader.github: {
        loader = new GithubRepoLoader(data as string, {
          branch: 'main',
          recursive: true,
          unknown: 'warn',
          maxConcurrency: 5,
        });
        break;
      }
      case DocumentLoader.website: {
        loader = new RecursiveUrlLoader(data as string, {
          extractor: compile({ wordwrap: 130 }),
          maxDepth: 1,
        });
        break;
      }
      default:
        throw new Error('Unsupported file type' + docLoader);
    }

    // select a splitter, for now we run with recursive but we can better improve this
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4000,
      chunkOverlap: 200,
    });

    // load and split content
    const contents: Document<Record<string, any>>[] = await loader.load();
    const splittedDocuments = await splitter.splitDocuments(contents);

    // merge metadata
    const documents = splittedDocuments.map((d) => ({
      pageContent: d.pageContent,
      metadata: {
        ...d.metadata,
        ...metadata,
      },
    }));

    return this.loadDocuments(documents);
  }

  // Adds the vectors to the vector store
  private async addVectors(
    vectors: number[][],
    documents: Document[],
  ): Promise<number[]> {
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
      const insertQuery = this.buildInsertQuery(chunk);
      const flatValues = chunk.flat();
      try {
        const res = await this.vectorStore.client.query(
          insertQuery,
          flatValues,
        );

        console.log('res', res.rows);
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

  private buildInsertQuery(rows: (string | Record<string, unknown>)[][]) {
    const columns = ['content', 'embedding', 'metadata'];

    // Check if we have added ids to the rows.
    if (rows.length !== 0 && columns.length === rows[0].length - 1) {
      columns.push('id');
    }

    const valuesPlaceholders = rows
      .map((_, j) => this.generatePlaceholderForRowAt(j, columns.length))
      .join(', ');

    const text = `
      INSERT INTO "Documents" (
        ${columns.map((column) => `"${column}"`).join(', ')}
      )
      VALUES ${valuesPlaceholders} RETURNING id
    `;

    return text;
  }
}
