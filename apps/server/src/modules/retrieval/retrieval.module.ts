import { Module } from '@nestjs/common';
import { LlmModule } from '@src/infra/llm/llm.module';
import { VectorStoreModule } from '@src/infra/vector-store/vectorstore.module';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [VectorStoreModule, LlmModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
