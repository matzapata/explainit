import { Module } from '@nestjs/common';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { VectorStoreService } from './vector-store.service';

@Module({
  imports: [PrismaModule, LlmModule],
  providers: [VectorStoreService],
  exports: [VectorStoreService],
})
export class VectorStoreModule {}
