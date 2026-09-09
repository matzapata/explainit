import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type {
  ChatMetadataDto,
  ChatOverviewDto,
} from '@/lib/services/chat-service';
import { ChatOverview } from './chat-overview';

vi.mock('@/lib/router', () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const emptyOverview: ChatOverviewDto = {
  since: '2026-08-10T00:00:00.000Z',
  questionsToday: 0,
  questions30d: 0,
  questionsAllTime: 0,
  conversations30d: 0,
  series: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-08-${String(10 + i).padStart(2, '0')}`,
    questions: 0,
  })),
};

const usedOverview: ChatOverviewDto = {
  since: '2026-08-10T00:00:00.000Z',
  questionsToday: 2,
  questions30d: 7,
  questionsAllTime: 12,
  conversations30d: 3,
  series: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-08-${String(i + 1).padStart(2, '0')}`,
    questions: i === 29 ? 2 : 0,
  })),
};

function baseChat(overrides: Partial<ChatMetadataDto> = {}): ChatMetadataDto {
  return {
    id: 'chat-1',
    name: 'Docs',
    conversationStarters: [],
    published: false,
    points: 0,
    hostOrigins: [],
    resources: [],
    lastUsedAt: null,
    ...overrides,
  };
}

describe('ChatOverview', () => {
  it('shows an empty banner that links to Setup', () => {
    render(<ChatOverview chat={baseChat()} overview={emptyOverview} />);

    expect(screen.getByText('Ready for questions')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View setup' })).toHaveAttribute(
      'href',
      '/chats/chat-1/setup',
    );
  });

  it('shows KPI numbers and failed-resource details', () => {
    render(
      <ChatOverview
        chat={baseChat({
          published: true,
          hostOrigins: ['https://docs.example.com'],
          lastUsedAt: new Date(Date.now() - 60_000).toISOString(),
          resources: [
            {
              id: 'r1',
              type: 'website',
              data: 'https://docs.example.com/a',
              title: 'Guide',
              status: 'ready',
            },
            {
              id: 'r2',
              type: 'text',
              data: 'broken notes',
              title: 'Billing',
              status: 'failed',
              error: 'crawl timed out',
            },
          ],
        })}
        overview={usedOverview}
      />,
    );

    expect(screen.queryByText('Ready for questions')).not.toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('today: 2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('crawl timed out')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute(
      'href',
      '/chats/chat-1/resources',
    );
    expect(screen.getAllByText('done')).toHaveLength(3);
  });

  it('highlights missing host origins and incomplete setup', () => {
    render(
      <ChatOverview
        chat={baseChat({ published: true, resources: [] })}
        overview={usedOverview}
      />,
    );

    expect(screen.getByText('Setup incomplete')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'add domains in Settings' }),
    ).toHaveAttribute('href', '/chats/chat-1/settings');
    expect(
      screen.getByRole('link', { name: 'add docs in Resources' }),
    ).toHaveAttribute('href', '/chats/chat-1/resources');
    expect(screen.getAllByText('fix').length).toBeGreaterThanOrEqual(2);
  });
});
