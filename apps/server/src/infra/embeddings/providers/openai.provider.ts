import { Injectable } from '@nestjs/common';
import { EmbeddingsProvider } from './embeddings.provider';
import { EnvService } from '@src/infra/env/env.service';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class OpenAiEmbeddingsProvider implements EmbeddingsProvider {
  private readonly openAiEmbeddings: OpenAIEmbeddings;

  constructor(private readonly env: EnvService) {
    this.openAiEmbeddings = new OpenAIEmbeddings({
      openAIApiKey: this.env.get('OPENAI_API_KEY'),
    });
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    // OpenAI recommends replacing newlines with spaces for best results
    const input = text.replace(/\n/g, ' ');
    return this.openAiEmbeddings.embedQuery(input);
  }
}
