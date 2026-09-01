import { Module } from '@nestjs/common';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { LlmModule } from '@src/infra/llm/llm.module';
import { VectorStoreModule } from '@src/infra/vectorstore/vectorstore.module';
import { ChatsService } from './application/chat.service';
import { RagLoaderService } from './application/rag-loader.service';
import { RagService } from './application/rag.service';
import { ChatRepository } from './application/repositories/chat.repository';
import { ResourcesRepository } from './application/repositories/resources.repository';
import { ResourcesService } from './application/resources.service';

@Module({
  providers: [
    RagService,
    ChatsService,
    ChatRepository,
    ResourcesService,
    ResourcesRepository,
    RagLoaderService,
  ],
  imports: [PrismaModule, VectorStoreModule, LlmModule],
  exports: [RagService, ChatsService, ResourcesService, RagLoaderService],
})
export class ChatModule {}
