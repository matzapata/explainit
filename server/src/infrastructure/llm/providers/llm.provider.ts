import { BaseLLM } from 'langchain/llms/base';

export abstract class LlmProvider {
  abstract model: BaseLLM;
}
