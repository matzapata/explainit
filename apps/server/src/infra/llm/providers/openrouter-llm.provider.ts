import { ChatOpenRouter } from '@langchain/openrouter';
import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LlmProvider } from './llm.provider';

@Injectable()
export class OpenRouterLlmProvider implements LlmProvider {
  public model: BaseChatModel;

  constructor(private readonly env: EnvService) {
    this.model = new ChatOpenRouter({
      model: this.env.get('OPENROUTER_MODEL'),
      apiKey: this.env.get('OPENROUTER_API_KEY'),
      baseURL: this.env.get('OPENROUTER_BASE_URL'),
      temperature: 0.8,
      siteName: 'explainit',
    });
  }
}
