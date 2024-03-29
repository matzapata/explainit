import { OpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseLLM } from 'langchain/llms/base';
import { LlmProvider } from './llm.provider';

@Injectable()
export class OpenAILlmProvider implements LlmProvider {
  public model: BaseLLM;

  constructor(private readonly configService: ConfigService) {
    this.model = new OpenAI({
      modelName: 'gpt-3.5-turbo-0613',
      temperature: 0.8,
      openAIApiKey: this.configService.get('OPENAI_API_KEY'),
      // streaming: true, // TODO:
    });
  }
}
