import { Injectable } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { LlmService } from '@src/infra/llm/llm.service';
import { Span } from '@src/infra/observability/decorators/span.decorator';
import { VectorStoreService } from '@src/infra/vector-store/vectorstore.service';
import { MessageAgent } from '../chat/message';
import { CONDENSE_QUESTION_PROMPT } from '../chat/prompts/rag-system.prompt';

@Injectable()
export class RetrievalService {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly llmService: LlmService,
  ) {}

  async buildStandaloneQuestion(
    question: string,
    chatHistory: { agent: MessageAgent; message: string }[],
  ) {
    const formatChatHistory = (
      history: { agent: MessageAgent; message: string }[],
    ) => {
      const formattedDialogueTurns = history.map((dialogueTurn) => {
        if (dialogueTurn.agent === MessageAgent.USER) {
          return `User: ${dialogueTurn.message}`;
        }
        return `Assistant: ${dialogueTurn.message}`;
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

    return standaloneQuestionChain.invoke({
      question,
      chatHistory,
    });
  }

  @Span({ name: 'retrieve' })
  async retrieve(question: string, k: number, namespace: string) {
    return this.vectorStoreService.similaritySearch(question, k, namespace);
  }
}
