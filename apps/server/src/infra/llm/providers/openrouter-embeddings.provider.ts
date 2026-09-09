import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import type { EmbeddingsProvider } from './embeddings.provider';

@Injectable()
export class OpenRouterEmbeddingsProvider implements EmbeddingsProvider {
  constructor(private readonly env: EnvService) {}

  async generateEmbeddings(text: string): Promise<number[]> {
    const input = text.replace(/\n/g, ' ');
    const baseURL = this.env.get('OPENROUTER_BASE_URL').replace(/\/+$/, '');
    const response = await fetch(`${baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'X-Title': 'explainit',
      },
      body: JSON.stringify({
        model: this.env.get('OPENROUTER_EMBEDDING_MODEL'),
        input,
      }),
    });

    const body = (await response.json()) as {
      error?: { message?: string };
      data?: { embedding?: unknown }[];
    };

    if (!response.ok) {
      throw new Error(
        body.error?.message ??
          `OpenRouter embeddings failed (${response.status})`,
      );
    }

    const embedding = body.data?.[0]?.embedding;
    if (
      !Array.isArray(embedding) ||
      embedding.length === 0 ||
      embedding.some((n) => typeof n !== 'number' || !Number.isFinite(n))
    ) {
      throw new Error('OpenRouter embeddings response had no vector');
    }

    return embedding;
  }
}
