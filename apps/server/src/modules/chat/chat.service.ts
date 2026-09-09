import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { LlmService } from '@src/infra/llm/llm.service';
import { Span } from '@src/infra/observability/decorators/span.decorator';
import type { EmbeddingHit } from '@src/infra/vector-store/providers/vector-store.provider';
import { RetrievalService } from '@src/modules/retrieval/retrieval.service';
import { ChatRepository } from './chat.repository';
import { nextAvailableColor } from './chat-colors';
import { MessageAgent } from './message';
import { ANSWER_PROMPT } from './prompts/rag-system.prompt';

export { MessageAgent };

export type AnswerOptions = {
  pageUrl?: string | null;
  selectedText?: string | null;
};

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly retrievalService: RetrievalService,
    private readonly llmService: LlmService,
  ) {}

  async create(owner: string, data: Omit<Prisma.ChatCreateInput, 'owner'>) {
    const color =
      data.color ??
      nextAvailableColor(
        (await this.chatRepository.findManyByOwner(owner)).map(
          (chat) => chat.color,
        ),
      );

    return this.chatRepository.create({
      ...data,
      color,
      owner: { connect: { id: owner } },
    });
  }

  update(
    owner: string,
    id: string,
    data: Omit<Prisma.ChatUpdateInput, 'owner'>,
  ) {
    return this.chatRepository.update(owner, id, data);
  }

  findFirstByOwner(ownerId: string) {
    return this.chatRepository.findFirstByOwner(ownerId);
  }

  findManyByOwner(ownerId: string) {
    return this.chatRepository.findManyByOwner(ownerId);
  }

  findFirstById(id: string) {
    return this.chatRepository.findFirstById(id);
  }

  delete(id: string) {
    return this.chatRepository.delete(id);
  }

  incrementPoints(id: string) {
    return this.chatRepository.incrementPoints(id);
  }

  async answer(
    question: string,
    chatHistory: { agent: MessageAgent; message: string }[],
    k: number,
    namespace: string,
    onToken: (token: string) => void = () => undefined,
    signal?: AbortSignal,
    options: AnswerOptions = {},
  ): Promise<{ question: string; answer: string; context: EmbeddingHit[] }> {
    const selectedText = options.selectedText?.trim() || '';
    const standaloneQuestion =
      await this.retrievalService.buildStandaloneQuestion(
        question,
        chatHistory,
        selectedText || null,
      );

    const context = await this.retrievalService.retrieve(
      standaloneQuestion,
      k,
      namespace,
      options.pageUrl,
    );

    const answer = await this.generate(
      standaloneQuestion,
      context,
      selectedText,
      onToken,
      signal,
    );

    return {
      context,
      question,
      answer,
    };
  }

  @Span({ name: 'generate' })
  async generate(
    question: string,
    context: EmbeddingHit[],
    selectedText: string,
    onToken: (token: string) => void = () => undefined,
    signal?: AbortSignal,
  ) {
    const answerChain = RunnableSequence.from([
      {
        context: (input) => input.context,
        question: (input) => input.question,
        selectedText: (input) => input.selectedText,
      },
      ANSWER_PROMPT,
      this.llmService.model,
      new StringOutputParser(),
    ]);

    const stream = await answerChain.stream(
      {
        question,
        selectedText: selectedText || '(none)',
        context: context.map((doc) => doc.content).join('\n\n'),
      },
      { signal },
    );

    let answer = '';
    for await (const chunk of stream) {
      const token = tokenText(chunk);
      if (!token) {
        continue;
      }
      answer += token;
      onToken(token);
    }

    return answer;
  }
}

export function tokenText(chunk: unknown): string {
  if (typeof chunk === 'string') {
    return chunk;
  }
  if (!chunk || typeof chunk !== 'object') {
    return '';
  }
  if (!('content' in chunk)) {
    return '';
  }

  const content = (chunk as { content: unknown }).content;
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (part && typeof part === 'object' && 'text' in part) {
        return String((part as { text: unknown }).text ?? '');
      }
      return '';
    })
    .join('');
}
