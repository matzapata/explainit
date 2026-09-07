import { RunnableLambda } from '@langchain/core/runnables';
import { LlmService } from '@src/infra/llm/llm.service';
import { RetrievalService } from '@src/modules/retrieval/retrieval.service';
import { ChatRepository } from './chat.repository';
import { ChatsService, tokenText } from './chat.service';
import { MessageAgent } from './message';

describe('ChatsService', () => {
  const chatRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findFirstByOwner: jest.fn(),
    findManyByOwner: jest.fn(),
    findFirstById: jest.fn(),
    delete: jest.fn(),
    incrementPoints: jest.fn(),
  };

  const retrievalService = {
    buildStandaloneQuestion: jest.fn(),
    retrieve: jest.fn(),
  };

  let capturedPrompt = '';
  const llmService = {
    model: RunnableLambda.from(async (input) => {
      capturedPrompt = String(input);
      return 'grounded answer';
    }),
  };

  const service = new ChatsService(
    chatRepository as unknown as ChatRepository,
    retrievalService as unknown as RetrievalService,
    llmService as unknown as LlmService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    capturedPrompt = '';
    llmService.model = RunnableLambda.from(async (input) => {
      capturedPrompt = String(input);
      return 'grounded answer';
    });
  });

  describe('answer', () => {
    it('retrieves with the standalone question and generates an answer', async () => {
      const history = [
        { agent: MessageAgent.USER, message: 'hello' },
        { agent: MessageAgent.AGENT, message: 'hi' },
      ];
      const context = [
        {
          id: 'emb-1',
          content: 'pricing is $10',
          namespace: 'chat-1',
          metadata: { source: 'https://docs.example.com' },
          similarity: 0.91,
        },
        {
          id: 'emb-2',
          content: 'billed monthly',
          namespace: 'chat-1',
          metadata: {},
          similarity: 0.8,
        },
      ];
      retrievalService.buildStandaloneQuestion.mockResolvedValue(
        'What is the price?',
      );
      retrievalService.retrieve.mockResolvedValue(context);

      const tokens: string[] = [];
      const result = await service.answer(
        'how much?',
        history,
        4,
        'chat-1',
        (token) => tokens.push(token),
      );

      expect(retrievalService.buildStandaloneQuestion).toHaveBeenCalledWith(
        'how much?',
        history,
        null,
      );
      expect(retrievalService.retrieve).toHaveBeenCalledWith(
        'What is the price?',
        4,
        'chat-1',
        undefined,
      );
      expect(capturedPrompt).toContain('What is the price?');
      expect(capturedPrompt).toContain('pricing is $10');
      expect(capturedPrompt).toContain('billed monthly');
      expect(tokens.join('')).toBe('grounded answer');
      expect(result).toEqual({
        context,
        question: 'how much?',
        answer: 'grounded answer',
      });
    });
  });

  describe('tokenText', () => {
    it('reads string chunks and message content', () => {
      expect(tokenText('hello')).toBe('hello');
      expect(tokenText({ content: 'there' })).toBe('there');
      expect(tokenText({ content: [{ text: 'a' }, { text: 'b' }] })).toBe('ab');
      expect(tokenText(null)).toBe('');
    });
  });
});
