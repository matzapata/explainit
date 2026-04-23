import { Module } from '@nestjs/common';
import { VectorStoreService } from './vectorstore.service';
import { PrismaModule } from '@src/database/prisma.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [PrismaModule, EmbeddingsModule],
  providers: [VectorStoreService],
  exports: [VectorStoreService],
})
export class VectorStoreModule {}
