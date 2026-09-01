import { OpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { BaseLLM } from 'langchain/llms/base';
import { LlmProvider } from './llm.provider';

@Injectable()
export class OpenAILlmProvider implements LlmProvider {
  public model: BaseLLM;

  constructor(private readonly env: EnvService) {
    this.model = new OpenAI({
      modelName: 'gpt-3.5-turbo-0125',
      temperature: 0.8,
      openAIApiKey: this.env.get('OPENAI_API_KEY'),
      cache: false,
    });
  }
}
