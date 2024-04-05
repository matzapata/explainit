import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { RetrievalAugmentedGenerationService } from './services/rag.service';
import { ChatsService } from './services/chat.service';
import { PaymentsModule } from '@src/payments/payments.module';
import { PrismaModule } from '@src/database/prisma.module';
import { ChatRepository } from './repositories/chat.repository';
import { ResourcesService } from './services/resources.service';
import { ResourcesRepository } from './repositories/resources.repository';
import { VectorStoreModule } from '@src/infrastructure/vectorstore/vectorstore.module';
import { LlmModule } from '@src/infrastructure/llm/llm.module';
import { StorageModule } from '@src/infrastructure/storage/storage.module';

@Module({
  providers: [
    RetrievalAugmentedGenerationService,
    ChatsService,
    ChatRepository,
    ResourcesService,
    ResourcesRepository,
  ],
  imports: [
    PrismaModule,
    PaymentsModule,
    VectorStoreModule,
    LlmModule,
    StorageModule,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
