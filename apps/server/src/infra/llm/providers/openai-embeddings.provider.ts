import { Injectable } from '@nestjs/common';
import { EmbeddingsProvider } from './embeddings.provider';
import { EnvService } from '@src/infra/env/env.service';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class OpenAiEmbeddingsProvider implements EmbeddingsProvider {
  private readonly openAiEmbeddings: OpenAIEmbeddings;

  constructor(private readonly env: EnvService) {
    const baseURL = this.env.get('OPENAI_BASE_URL');

    this.openAiEmbeddings = new OpenAIEmbeddings({
      openAIApiKey: this.env.get('OPENAI_API_KEY'),
      modelName: this.env.get('OPENAI_EMBEDDING_MODEL'),
      configuration: baseURL ? { baseURL } : undefined,
    });
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    // OpenAI recommends replacing newlines with spaces for best results
    const input = text.replace(/\n/g, ' ');
    return this.openAiEmbeddings.embedQuery(input);
  }
}
