import { Injectable } from '@nestjs/common';
import { ChatResource } from '@prisma/client';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { NodeHtmlMarkdown } from 'node-html-markdown';

interface RagDocument {
  content: string;
  namespace: string;
  metadata: Record<string, any>;
}

@Injectable()
export class RagLoaderService {
  async generateDocsFromHtml(
    doc: {
      html: string;
      url: string;
      title: string;
    },
    namespace: string,
    metadata?: Record<string, any>,
  ): Promise<RagDocument[]> {
    // split the documents into chunks
    const nhm = new NodeHtmlMarkdown();
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
      chunkSize: 3000,
      chunkOverlap: 100,
    });

    const mdText = nhm.translate(doc.html);
    const documents = await splitter.createDocuments([mdText]);

    return documents.map((d) => ({
      content: d.pageContent,
      namespace: namespace,
      metadata: {
        url: doc.url,
        title: doc.title,
        ...metadata,
      },
    }));
  }
}
