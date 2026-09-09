import type { ConversationRepository } from './conversation.repository';
import { ConversationService } from './conversation.service';
import { MessageAgent } from './message';

describe('ConversationService', () => {
  const conversationRepository = {
    findById: jest.fn(),
    create: jest.fn(),
    touch: jest.fn(),
    createMessages: jest.fn(),
    findRecentMessages: jest.fn(),
    overviewStats: jest.fn(),
  };

  const service = new ConversationService(
    conversationRepository as unknown as ConversationRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('historyFor', () => {
    it('maps recent messages to agent/message turns for condensation', async () => {
      conversationRepository.findRecentMessages.mockResolvedValue([
        { role: MessageAgent.USER, content: 'hello' },
        { role: MessageAgent.AGENT, content: 'hi there' },
      ]);

      await expect(service.historyFor('conv-1')).resolves.toEqual([
        { agent: MessageAgent.USER, message: 'hello' },
        { agent: MessageAgent.AGENT, message: 'hi there' },
      ]);
      expect(conversationRepository.findRecentMessages).toHaveBeenCalledWith(
        'conv-1',
        20,
      );
    });
  });
});
