import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EmbeddingHit } from '@src/infra/vector-store/providers/vector-store.provider';
import { ConversationRepository } from './conversation.repository';
import { MessageAgent } from './message';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async resolveConversationId(
    chatId: string,
    cookieConversationId: string | undefined,
  ): Promise<string> {
    if (cookieConversationId) {
      const existing = await this.conversationRepository.findById(
        cookieConversationId,
      );
      if (existing && existing.chatId === chatId) {
        return existing.id;
      }
    }

    const created = await this.conversationRepository.create(
      chatId,
      randomUUID(),
    );
    return created.id;
  }

  async persistTurn(input: {
    conversationId: string;
    chatId: string;
    question: string;
    answer: string;
    context: EmbeddingHit[];
    pageUrl?: string | null;
    selectedText?: string | null;
  }): Promise<void> {
    try {
      await this.conversationRepository.createMessages([
        {
          conversationId: input.conversationId,
          chatId: input.chatId,
          role: MessageAgent.USER,
          content: input.question,
          pageUrl: input.pageUrl ?? null,
          selectedText: input.selectedText ?? null,
        },
        {
          conversationId: input.conversationId,
          chatId: input.chatId,
          role: MessageAgent.AGENT,
          content: input.answer,
          context: input.context as object[],
          pageUrl: input.pageUrl ?? null,
          selectedText: input.selectedText ?? null,
        },
      ]);
      await this.conversationRepository.touch(input.conversationId);
    } catch (error) {
      this.logger.warn(
        `Failed to persist conversation ${input.conversationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
