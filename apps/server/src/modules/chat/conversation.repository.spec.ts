import type { PrismaService } from '@src/infra/database/prisma.service';
import {
  addUtcDays,
  bucketByUtcDay,
  ConversationRepository,
  startOfUtcDay,
} from './conversation.repository';
import { MessageAgent } from './message';

describe('ConversationRepository', () => {
  const prisma = {
    conversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    message: {
      createMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const repo = new ConversationRepository(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bucketByUtcDay', () => {
    it('zero-fills a 30-day window and counts messages per UTC day', () => {
      const since = new Date('2026-08-10T00:00:00.000Z');
      const series = bucketByUtcDay(
        [
          new Date('2026-08-10T12:00:00.000Z'),
          new Date('2026-08-10T18:00:00.000Z'),
          new Date('2026-08-12T01:00:00.000Z'),
        ],
        since,
        5,
      );

      expect(series).toEqual([
        { date: '2026-08-10', questions: 2 },
        { date: '2026-08-11', questions: 0 },
        { date: '2026-08-12', questions: 1 },
        { date: '2026-08-13', questions: 0 },
        { date: '2026-08-14', questions: 0 },
      ]);
    });
  });

  describe('findRecentMessages', () => {
    it('loads the newest messages then returns them oldest-first', async () => {
      prisma.message.findMany.mockResolvedValue([
        { role: MessageAgent.AGENT, content: 'second' },
        { role: MessageAgent.USER, content: 'first' },
      ]);

      const messages = await repo.findRecentMessages('conv-1', 20);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { role: true, content: true },
      });
      expect(messages).toEqual([
        { role: MessageAgent.USER, content: 'first' },
        { role: MessageAgent.AGENT, content: 'second' },
      ]);
    });
  });

  describe('overviewStats', () => {
    it('queries counts and builds a 30-day series from user messages', async () => {
      const now = new Date('2026-09-08T15:30:00.000Z');
      const since = startOfUtcDay(addUtcDays(now, -29));
      const todayStart = startOfUtcDay(now);
      const tomorrowStart = addUtcDays(todayStart, 1);

      prisma.message.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1);
      prisma.conversation.count.mockResolvedValue(2);
      prisma.message.findMany.mockResolvedValue([
        { createdAt: new Date('2026-09-08T10:00:00.000Z') },
        { createdAt: new Date('2026-09-01T10:00:00.000Z') },
        { createdAt: new Date('2026-09-01T11:00:00.000Z') },
      ]);

      const stats = await repo.overviewStats('chat-1', now);

      expect(prisma.message.count).toHaveBeenNthCalledWith(1, {
        where: { chatId: 'chat-1', role: MessageAgent.USER },
      });
      expect(prisma.message.count).toHaveBeenNthCalledWith(2, {
        where: {
          chatId: 'chat-1',
          role: MessageAgent.USER,
          createdAt: { gte: since },
        },
      });
      expect(prisma.message.count).toHaveBeenNthCalledWith(3, {
        where: {
          chatId: 'chat-1',
          role: MessageAgent.USER,
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      });
      expect(prisma.conversation.count).toHaveBeenCalledWith({
        where: {
          chatId: 'chat-1',
          OR: [{ createdAt: { gte: since } }, { updatedAt: { gte: since } }],
        },
      });
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          chatId: 'chat-1',
          role: MessageAgent.USER,
          createdAt: { gte: since },
        },
        select: { createdAt: true },
      });

      expect(stats.since).toEqual(since);
      expect(stats.questionsAllTime).toBe(10);
      expect(stats.questions30d).toBe(4);
      expect(stats.questionsToday).toBe(1);
      expect(stats.conversations30d).toBe(2);
      expect(stats.series).toHaveLength(30);
      expect(stats.series[0]).toEqual({
        date: '2026-08-10',
        questions: 0,
      });
      expect(stats.series[22]).toEqual({
        date: '2026-09-01',
        questions: 2,
      });
      expect(stats.series[29]).toEqual({
        date: '2026-09-08',
        questions: 1,
      });
    });
  });
});
