import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/infra/database/prisma.service';
import { MessageAgent } from './message';

type NewMessage = {
  conversationId: string;
  chatId: string;
  role: string;
  content: string;
  context?: object | null;
  pageUrl?: string | null;
  selectedText?: string | null;
};

export type OverviewSeriesPoint = {
  date: string;
  questions: number;
};

export type OverviewStats = {
  since: Date;
  questionsToday: number;
  questions30d: number;
  questionsAllTime: number;
  conversations30d: number;
  series: OverviewSeriesPoint[];
};

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  create(chatId: string, id?: string) {
    return this.prisma.conversation.create({
      data: {
        ...(id ? { id } : {}),
        chatId,
      },
    });
  }

  touch(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  createMessages(data: NewMessage[]) {
    return this.prisma.message.createMany({ data });
  }

  async overviewStats(
    chatId: string,
    now = new Date(),
  ): Promise<OverviewStats> {
    const since = startOfUtcDay(addUtcDays(now, -29));
    const todayStart = startOfUtcDay(now);
    const tomorrowStart = addUtcDays(todayStart, 1);

    const [
      questionsAllTime,
      questions30d,
      questionsToday,
      conversations30d,
      recent,
    ] = await Promise.all([
      this.prisma.message.count({
        where: { chatId, role: MessageAgent.USER },
      }),
      this.prisma.message.count({
        where: {
          chatId,
          role: MessageAgent.USER,
          createdAt: { gte: since },
        },
      }),
      this.prisma.message.count({
        where: {
          chatId,
          role: MessageAgent.USER,
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.conversation.count({
        where: {
          chatId,
          OR: [{ createdAt: { gte: since } }, { updatedAt: { gte: since } }],
        },
      }),
      this.prisma.message.findMany({
        where: {
          chatId,
          role: MessageAgent.USER,
          createdAt: { gte: since },
        },
        select: { createdAt: true },
      }),
    ]);

    return {
      since,
      questionsToday,
      questions30d,
      questionsAllTime,
      conversations30d,
      series: bucketByUtcDay(
        recent.map((m) => m.createdAt),
        since,
        30,
      ),
    };
  }
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function utcDayKey(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

export function bucketByUtcDay(
  dates: Date[],
  since: Date,
  days: number,
): OverviewSeriesPoint[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = utcDayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: OverviewSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const day = addUtcDays(since, i);
    const key = utcDayKey(day);
    series.push({ date: key, questions: counts.get(key) ?? 0 });
  }
  return series;
}
