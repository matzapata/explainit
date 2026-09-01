import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { EmbeddingsService } from './embeddings.service';

@Module({
  providers: [LlmService, EmbeddingsService],
  exports: [LlmService, EmbeddingsService],
})
export class LlmModule {}
