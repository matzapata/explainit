import { RunnableLambda } from '@langchain/core/runnables';
import type { LlmService } from '@src/infra/llm/llm.service';
import type { VectorStoreService } from '@src/infra/vector-store/vector-store.service';
import { MessageAgent } from '../chat/message';
import { RetrievalService } from './retrieval.service';

describe('RetrievalService', () => {
  const vectorStoreService = {
    similaritySearch: jest.fn(),
  };

  let capturedPrompt = '';
  const llmService = {
    model: RunnableLambda.from(async (input) => {
      capturedPrompt = String(input);
      return 'What is the pricing page about?';
    }),
  };

  const service = new RetrievalService(
    vectorStoreService as unknown as VectorStoreService,
    llmService as unknown as LlmService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    capturedPrompt = '';
  });

  describe('buildStandaloneQuestion', () => {
    it('formats chat history and returns the condensed question', async () => {
      const result = await service.buildStandaloneQuestion('what about it?', [
        { agent: MessageAgent.USER, message: 'tell me about pricing' },
        { agent: MessageAgent.AGENT, message: 'it is on /pricing' },
      ]);

      expect(result).toBe('What is the pricing page about?');
      expect(capturedPrompt).toContain('User: tell me about pricing');
      expect(capturedPrompt).toContain('Assistant: it is on /pricing');
      expect(capturedPrompt).toContain('what about it?');
    });
  });

  describe('retrieve', () => {
    it('searches the vector store with k and namespace', async () => {
      const hits = [
        {
          id: 'emb-1',
          content: 'chunk',
          namespace: 'chat-1',
          metadata: {},
          similarity: 0.9,
        },
      ];
      vectorStoreService.similaritySearch.mockResolvedValue(hits);

      await expect(
        service.retrieve('standalone question', 4, 'chat-1'),
      ).resolves.toEqual(hits);
      expect(vectorStoreService.similaritySearch).toHaveBeenCalledWith(
        'standalone question',
        12,
        'chat-1',
      );
    });
  });
});
