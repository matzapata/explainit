import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ChunkingModule } from '@src/infra/chunking/chunking.module';
import { CrawlerModule } from '@src/infra/crawler/crawler.module';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { ObjectStorageModule } from '@src/infra/object-storage/object-storage.module';
import { ScraperModule } from '@src/infra/scraper/scraper.module';
import { VectorStoreModule } from '@src/infra/vector-store/vector-store.module';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { INGEST_QUEUE } from './ingest-job';
@Module({
  imports: [
    PrismaModule,
    ScraperModule,
    CrawlerModule,
    ChunkingModule,
    VectorStoreModule,
    ObjectStorageModule,
    BullModule.registerQueue({
      name: INGEST_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5_000,
        },
        removeOnComplete: true,
      },
    }),
  ],
  providers: [DocumentsRepository, DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
