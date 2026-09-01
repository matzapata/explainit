import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LlmProvider } from './llm.provider';

@Injectable()
export class OpenAILlmProvider implements LlmProvider {
  public model: BaseChatModel;

  constructor(private readonly env: EnvService) {
    const baseURL = this.env.get('OPENAI_BASE_URL');

    this.model = new ChatOpenAI({
      modelName: this.env.get('OPENAI_MODEL'),
      temperature: 0.8,
      openAIApiKey: this.env.get('OPENAI_API_KEY'),
      cache: false,
      configuration: baseURL ? { baseURL } : undefined,
    });
  }
}
