import { Prisma } from '@prisma/client';
import { ChatRepository } from './chat.repository';
import { Injectable } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import { Document } from 'langchain/document';
import { LlmService } from '@src/infra/llm/llm.service';
import { Span } from '@src/infra/observability/decorators/span.decorator';
import { EmbeddingHit } from '@src/infra/vector-store/providers/vectorstore.provider';
import { RetrievalService } from '@src/modules/retrieval/retrieval.service';
import { MessageAgent } from './message';
import { ANSWER_PROMPT } from './prompts/rag-system.prompt';

export { MessageAgent };

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly retrievalService: RetrievalService,
    private readonly llmService: LlmService,
  ) {}

  create(owner: string, data: Omit<Prisma.ChatCreateInput, 'owner'>) {
    return this.chatRepository.create({
      ...data,
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

  incrementPoints(id: string) {
    return this.chatRepository.incrementPoints(id);
  }

  async answer(
    question: string,
    chatHistory: { agent: MessageAgent; message: string }[],
    k: number,
    namespace: string,
  ): Promise<{ question: string; answer: string; context: EmbeddingHit[] }> {
    const standaloneQuestion =
      await this.retrievalService.buildStandaloneQuestion(
        question,
        chatHistory,
      );

    const context = await this.retrievalService.retrieve(
      standaloneQuestion,
      k,
      namespace,
    );

    const answer = await this.generate(standaloneQuestion, context);

    return {
      context,
      question,
      answer,
    };
  }

  @Span({ name: 'generate' })
  async generate(question: string, context: EmbeddingHit[]) {
    const answerChain = RunnableSequence.from([
      {
        context: (input) => input.context,
        question: (input) => input.question,
      },
      ANSWER_PROMPT,
      this.llmService.model,
      new StringOutputParser(),
    ]);

    return answerChain.invoke({
      question,
      context: formatDocumentsAsString(
        context.map((doc) => new Document({ pageContent: doc.content })),
      ),
    });
  }
}
