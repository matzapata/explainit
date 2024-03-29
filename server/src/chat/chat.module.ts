import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { RetrievalAugmentedGenerationService } from './services/rag.service';
import { ChatsService } from './services/chat.service';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { PlanCheckerService } from 'src/payments/services/plan-checker.service';
import { VectorStoreService } from 'src/infrastructure/vectorstore/vectorstore.service';
import { LlmService } from 'src/infrastructure/llm/llm.service';
import { PrismaModule } from 'src/database/prisma.module';
import { MessagesRepository } from './repositories/messages.repository';
import { ChatRepository } from './repositories/chat.repository';

@Module({
  providers: [
    RetrievalAugmentedGenerationService,
    VectorStoreService,
    LlmService,
    ChatsService,
    StorageService,
    PlanCheckerService,
    MessagesRepository,
    ChatRepository,
  ],
  imports: [PrismaModule, PaymentsModule],
  controllers: [ChatController],
})
export class ChatModule {}
