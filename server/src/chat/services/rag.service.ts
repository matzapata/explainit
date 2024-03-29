import { Injectable } from '@nestjs/common';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  RunnableMap,
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import { AIMessage, HumanMessage } from 'langchain/schema';
import { VectorStoreService } from '../../infrastructure/vectorstore/vectorstore.service';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { MimeType } from 'src/infrastructure/vectorstore/vectorstore.service';
import { pull } from 'langchain/hub';
import { MessageAgent } from '@prisma/client';

// export enum MessageAgent {
//   user = 'USER',
//   ai = 'AI',
// }

@Injectable()
export class RetrievalAugmentedGenerationService {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly llmService: LlmService,
  ) {}

  public async loadFile(
    file: Blob,
    mimetype: MimeType,
    metadata: any,
  ): Promise<string[]> {
    return this.vectorStoreService.loadFile(file, mimetype, metadata);
  }

  public async deleteDocuments(ids: string[]) {
    return this.vectorStoreService.deleteDocuments(ids);
  }

  public async invoke(
    question: string,
    chat_history: { agent: MessageAgent; message: string }[],
    k: number,
    filter: any,
  ): Promise<{ question: string; answer: string; context: Document[] }> {
    // Contextualize the question with the chat history
    const contextualizedQuestion = await this.contextualizeQuestion(
      question,
      chat_history.map((msg) => {
        if (msg.agent === MessageAgent.USER) {
          return new HumanMessage(msg.message);
        } else {
          return new AIMessage(msg.message);
        }
      }),
    );

    // Build the RAG chain
    const prompt = await pull<ChatPromptTemplate>('rlm/rag-prompt');
    const ragChainFromDocs = RunnableSequence.from([
      RunnablePassthrough.assign({
        context: (input: any) => formatDocumentsAsString(input.context),
      }),
      prompt,
      this.llmService.model,
      new StringOutputParser(),
    ]);

    const ragChainWithSource = new RunnableMap({
      steps: {
        context: this.vectorStoreService.getRetriever(k, filter),
        question: new RunnablePassthrough(),
      },
    }).assign({ answer: ragChainFromDocs });

    return await ragChainWithSource.invoke(contextualizedQuestion);
  }

  private async contextualizeQuestion(question: string, chat_history: any) {
    const contextualizeQSystemPrompt = `Given a chat history and the latest user question
  which might reference context in the chat history, formulate a standalone question
  which can be understood without the chat history. Do NOT answer the question,
  just reformulate it if needed and otherwise return it as is.`;

    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ['system', contextualizeQSystemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{question}'],
    ]);
    const contextualizeQChain = contextualizeQPrompt
      .pipe(this.llmService.model)
      .pipe(new StringOutputParser());

    return await contextualizeQChain.invoke({
      chat_history,
      question,
    });
  }
}
