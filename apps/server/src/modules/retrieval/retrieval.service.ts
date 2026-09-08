import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Injectable } from '@nestjs/common';
import type { LlmService } from '@src/infra/llm/llm.service';
import { Span } from '@src/infra/observability/decorators/span.decorator';
import type { VectorStoreService } from '@src/infra/vector-store/vector-store.service';
import { MessageAgent } from '../chat/message';
import { CONDENSE_QUESTION_PROMPT } from '../chat/prompts/rag-system.prompt';
import { preferPageMatches } from '../chat/visitor-context';

@Injectable()
export class RetrievalService {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly llmService: LlmService,
  ) {}

  async buildStandaloneQuestion(
    question: string,
    chatHistory: { agent: MessageAgent; message: string }[],
    selectedText?: string | null,
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
      selectedText: string;
    };

    const standaloneQuestionChain = RunnableSequence.from([
      {
        question: (input: ConversationalRetrievalQAChainInput) =>
          input.question,
        chatHistory: (input: ConversationalRetrievalQAChainInput) =>
          formatChatHistory(input.chatHistory),
        selectedText: (input: ConversationalRetrievalQAChainInput) =>
          input.selectedText,
      },
      CONDENSE_QUESTION_PROMPT,
      this.llmService.model,
      new StringOutputParser(),
    ]);

    return standaloneQuestionChain.invoke({
      question,
      chatHistory,
      selectedText: selectedText?.trim() || '(none)',
    });
  }

  @Span({ name: 'retrieve' })
  async retrieve(
    question: string,
    k: number,
    namespace: string,
    pageUrl?: string | null,
  ) {
    // Fetch extra hits so page-matching sources can bubble up without starving other pages.
    const fetchK = Math.max(k * 3, k);
    const hits = await this.vectorStoreService.similaritySearch(
      question,
      fetchK,
      namespace,
    );
    return preferPageMatches(hits, pageUrl, k);
  }
}
