import { Module } from '@nestjs/common';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { LlmModule } from '@src/infra/llm/llm.module';
import { RetrievalModule } from '@src/modules/retrieval/retrieval.module';
import { ChatRepository } from './chat.repository';
import { ChatsService } from './chat.service';
import { ConversationRepository } from './conversation.repository';
import { ConversationService } from './conversation.service';

@Module({
  imports: [PrismaModule, RetrievalModule, LlmModule],
  providers: [
    ChatsService,
    ChatRepository,
    ConversationRepository,
    ConversationService,
  ],
  exports: [ChatsService, ConversationService],
})
export class ChatModule {}
