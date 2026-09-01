import { Injectable } from '@nestjs/common';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { createRecursiveCharMarkdownSplitter } from './strategies/recursive-char.strategy';

interface RagDocument {
  content: string;
  namespace: string;
  metadata: Record<string, any>;
}

@Injectable()
export class ChunkingService {
  async generateDocsFromHtml(
    doc: {
      html: string;
      url: string;
      title: string;
    },
    namespace: string,
    metadata?: Record<string, any>,
  ): Promise<RagDocument[]> {
    const nhm = new NodeHtmlMarkdown();
    const splitter = createRecursiveCharMarkdownSplitter();

    const mdText = nhm.translate(doc.html);
    const documents = await splitter.createDocuments([mdText]);

    return documents.map((d) => ({
      content: d.pageContent,
      namespace: namespace,
      metadata: {
        source: doc.url,
        title: doc.title,
        ...metadata,
      },
    }));
  }

  async generateDocsFromText(
    data: {
      text: string;
      source: string;
      title: string;
    },
    namespace: string,
    metadata?: Record<string, any>,
  ): Promise<RagDocument[]> {
    const splitter = createRecursiveCharMarkdownSplitter();
    const documents = await splitter.createDocuments([data.text]);

    return documents.map((d) => ({
      content: d.pageContent,
      namespace: namespace,
      metadata: {
        source: data.source,
        title: data.title,
        ...metadata,
      },
    }));
  }
}
