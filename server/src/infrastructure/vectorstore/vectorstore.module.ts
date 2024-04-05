import { Module } from '@nestjs/common';
import { VectorStoreService } from './vectorstore.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PrismaModule } from '@src/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VectorStoreService, EmbeddingsService],
  exports: [VectorStoreService],
})
export class VectorStoreModule {}
