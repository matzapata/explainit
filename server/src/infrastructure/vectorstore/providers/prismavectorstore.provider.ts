import { Injectable } from '@nestjs/common';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { Document } from 'langchain/document';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { GitbookLoader } from 'langchain/document_loaders/web/gitbook';
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';
import { RecursiveUrlLoader } from 'langchain/document_loaders/web/recursive_url';
import { VectorStoreProvider, DocumentLoader } from './vectorstore.provider';
import { compile } from 'html-to-text';
import { BaseDocumentLoader } from 'langchain/document_loaders/base';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PrismaService } from '@src/database/prisma.service';
import { EmbeddingsService } from '@src/infrastructure/embeddings/embeddings.service';
import { Embedding } from '@prisma/client';

@Injectable()
export class PrismaVectorStoreProvider implements VectorStoreProvider {
  constructor(
    private readonly embeddings: EmbeddingsService,
    private readonly prisma: PrismaService,
  ) {}

  async loadDocuments(
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

  async loadSource(
    data: string | Blob,
    docLoader: DocumentLoader,
    namespace: string,
    metadata?: Record<string, any>,
  ): Promise<Embedding['id'][]> {
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
      namespace,
      content: d.pageContent,
      metadata: {
        ...d.metadata,
        ...metadata,
      },
    }));

    return this.loadDocuments(documents);
  }
}
