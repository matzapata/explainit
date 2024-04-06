import { Injectable } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  DocumentLoader,
  VectorStoreService,
} from '../../infrastructure/vectorstore/vectorstore.service';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { Document } from 'langchain/document';
import { ChatResource, Embedding } from '@prisma/client';
import { CrawlerService } from '@src/infrastructure/crawler/crawler.service';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ResourcesService } from './resources.service';

export enum MessageAgent {
  USER = 'user',
  AGENT = 'agent',
}

@Injectable()
export class RetrievalAugmentedGenerationService {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly llmService: LlmService,
    private readonly crawlerService: CrawlerService,
    private readonly resourcesService: ResourcesService,
  ) {}

  // loaders ========================================

  // async loadSource(
  //   data: string | Blob,
  //   docLoader: DocumentLoader,
  //   namespace: string,
  //   metadata?: Record<string, any>,
  // ): Promise<Embedding['id'][]> {
  //   // validate data type
  //   switch (docLoader) {
  //     case DocumentLoader.text:
  //     case DocumentLoader.json:
  //     case DocumentLoader.pdf:
  //     case DocumentLoader.csv:
  //       if (Blob.prototype.isPrototypeOf(data)) {
  //         throw new Error('Data must be a blob for' + docLoader);
  //       }
  //       break;
  //     case DocumentLoader.gitbook:
  //     case DocumentLoader.github:
  //     case DocumentLoader.website:
  //       if (typeof data !== 'string') {
  //         throw new Error('Data must be a url for' + docLoader);
  //       }
  //       break;
  //     default:
  //       throw new Error('Unsupported file type' + docLoader);
  //   }

  //   // select correct loader and splitter
  //   let loader: BaseDocumentLoader;
  //   switch (docLoader) {
  //     case DocumentLoader.text: {
  //       loader = new TextLoader(data);
  //       break;
  //     }
  //     case DocumentLoader.json: {
  //       loader = new JSONLoader(data);
  //       break;
  //     }
  //     case DocumentLoader.pdf: {
  //       loader = new PDFLoader(data);
  //       break;
  //     }
  //     case DocumentLoader.csv: {
  //       loader = new CSVLoader(data);
  //       break;
  //     }
  //     case DocumentLoader.gitbook: {
  //       loader = new GitbookLoader(data as string);
  //       break;
  //     }
  //     case DocumentLoader.github: {
  //       loader = new GithubRepoLoader(data as string, {
  //         branch: 'main',
  //         recursive: true,
  //         unknown: 'warn',
  //         maxConcurrency: 5,
  //       });
  //       break;
  //     }
  //     case DocumentLoader.website: {
  //       loader = {
  //         load: async (): Promise<Document<Record<string, any>>[]> => {
  //           throw new Error('Not implemented');
  //         },
  //         loadAndSplit: async (): Promise<Document<Record<string, any>>[]> => {
  //           throw new Error('Not implemented');
  //         },
  //       };
  //       break;
  //     }
  //     default:
  //       throw new Error('Unsupported file type' + docLoader);
  //   }

  //   // select a splitter, for now we run with recursive but we can better improve this
  //   const splitter = new RecursiveCharacterTextSplitter({
  //     chunkSize: 4000,
  //     chunkOverlap: 200,
  //   });

  //   // load and split content
  //   const contents: Document<Record<string, any>>[] = await loader.load();
  //   const splittedDocuments = await splitter.splitDocuments(contents);

  //   // merge metadata
  //   const documents = splittedDocuments.map((d) => ({
  //     namespace,
  //     content: d.pageContent,
  //     metadata: {
  //       ...d.metadata,
  //       ...metadata,
  //     },
  //   }));

  //   return this.vectorStoreService.addDocuments(documents);
  // }

  async inspectWebpage(url: string) {
    const urls = await this.crawlerService.inspect({
      url,
    });

    return urls;
  }

  async loadWebpageWithCrawling(
    urls: string[],
    chatid: string,
    metadata?: Record<string, any>,
  ): Promise<ChatResource[]> {
    // crawl the website
    const documents = await this.crawlerService.scrape({
      urls,
    });

    // split the documents into chunks
    const nhm = new NodeHtmlMarkdown();
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
      chunkSize: 3000,
      chunkOverlap: 100,
    });

    const result: ChatResource[] = [];
    for (const d of documents) {
      // convert documents to markdown
      const mdText = nhm.translate(d.html);
      const docs = await splitter.createDocuments([mdText]);

      const ids = await this.vectorStoreService.addDocuments(
        docs.map((doc) => ({
          content: doc.pageContent,
          namespace: chatid,
          metadata: {
            url: d.url,
            title: d.title,
            ...metadata,
          },
        })),
      );

      const r = await this.resourcesService.create(chatid, {
        data: d.url,
        type: DocumentLoader.website,
        embeddingIds: ids,
      });
      result.push(r);
    }

    return result;
  }

  // delete ========================================

  public async deleteDocuments(ids: Embedding['id'][]) {
    return this.vectorStoreService.deleteDocuments(ids);
  }

  // invoke ========================================

  public async invoke(
    question: string,
    chatHistory: { agent: MessageAgent; message: string }[],
    k: number,
    namespace: string,
  ): Promise<{ question: string; answer: string; context: Embedding[] }> {
    // Contextualize the question with the chat history
    const standaloneQuestion = await this.buildStandaloneQuestion(
      question,
      chatHistory,
    );

    const context = await this.vectorStoreService.similaritySearch(
      standaloneQuestion,
      k,
      namespace,
    );

    // TODO: add stream here
    const answer = await this.buildAnswerQuestion(standaloneQuestion, context);

    return {
      context,
      question,
      answer,
    };
  }

  private async buildStandaloneQuestion(
    question: string,
    chatHistory: { agent: MessageAgent; message: string }[],
  ) {
    const condenseQuestionTemplate = `Given a chat history and the latest user question
    which might reference context in the chat history, formulate a standalone question
    which can be understood without the chat history. Do NOT answer the question,
    just reformulate it if needed and otherwise return it as is.
  
    Chat History:
      {chatHistory}
    Question:
      {question}`;
    const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
      condenseQuestionTemplate,
    );

    const formatChatHistory = (
      chatHistory: { agent: MessageAgent; message: string }[],
    ) => {
      const formattedDialogueTurns = chatHistory.map((dialogueTurn) => {
        if (dialogueTurn.agent === MessageAgent.USER) {
          return `User: ${dialogueTurn.message}`;
        } else {
          return `Assistant: ${dialogueTurn.message}`;
        }
      });
      return formattedDialogueTurns.join('\n');
    };

    type ConversationalRetrievalQAChainInput = {
      question: string;
      chatHistory: { agent: MessageAgent; message: string }[];
    };

    const standaloneQuestionChain = RunnableSequence.from([
      {
        question: (input: ConversationalRetrievalQAChainInput) =>
          input.question,
        chatHistory: (input: ConversationalRetrievalQAChainInput) =>
          formatChatHistory(input.chatHistory),
      },
      CONDENSE_QUESTION_PROMPT,
      this.llmService.model,
      new StringOutputParser(),
    ]);

    const standaloneQuestion = await standaloneQuestionChain.invoke({
      question: question,
      chatHistory: chatHistory,
    });
    return standaloneQuestion;
  }

  private async buildAnswerQuestion(question: string, context: Embedding[]) {
    const answerTemplate = `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know.
    Question: {question}
    Context: {context} 
    Answer:
  `;
    const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);

    const answerChain = RunnableSequence.from([
      {
        context: (input) => input.context,
        question: (input) => input.question,
      },
      ANSWER_PROMPT,
      this.llmService.model,
      new StringOutputParser(),
    ]);

    const answer = await answerChain.invoke({
      question: question,
      context: formatDocumentsAsString(
        context.map((doc) => new Document({ pageContent: doc.content })),
      ),
    });
    return answer;
  }
}
