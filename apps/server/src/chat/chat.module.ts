import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { RagService } from './services/rag.service';
import { ChatsService } from './services/chat.service';
import { PrismaModule } from '@src/database/prisma.module';
import { ChatRepository } from './repositories/chat.repository';
import { ResourcesService } from './services/resources.service';
import { ResourcesRepository } from './repositories/resources.repository';
import { VectorStoreModule } from '@src/infrastructure/vectorstore/vectorstore.module';
import { LlmModule } from '@src/infrastructure/llm/llm.module';
import { StorageModule } from '@src/infrastructure/storage/storage.module';
import { CrawlerModule } from '@src/infrastructure/crawler/cawler.module';
import { RagLoaderService } from './services/rag-loader.service';

@Module({
  providers: [
    RagService,
    ChatsService,
    ChatRepository,
    ResourcesService,
    ResourcesRepository,
    RagLoaderService,
  ],
  imports: [
    PrismaModule,
    VectorStoreModule,
    LlmModule,
    StorageModule,
    CrawlerModule,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
