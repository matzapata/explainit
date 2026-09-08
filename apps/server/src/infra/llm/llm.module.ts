import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { LlmService } from './llm.service';

@Module({
  providers: [LlmService, EmbeddingsService],
  exports: [LlmService, EmbeddingsService],
})
export class LlmModule {}
