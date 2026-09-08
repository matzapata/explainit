import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ResourcesTable from './resources-table';
import type { ChatResource } from '@/lib/services/chat-service';

vi.mock('@/lib/auth/use-session', () => ({
  useAccessToken: () => 'token',
}));

vi.mock('@/lib/services/chat-service', () => ({
  chatService: {
    getOwnerChatById: vi.fn(),
    addTextResource: vi.fn(),
    addWebResource: vi.fn(),
    inspectResource: vi.fn(),
    deleteResource: vi.fn(),
  },
}));

function renderTable(resources: ChatResource[]) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ResourcesTable chatId="chat-1" initialResources={resources} />
    </QueryClientProvider>,
  );
}

describe('ResourcesTable', () => {
  it('links URL sources and shows Updated dates', () => {
    renderTable([
      {
        id: 'resource-1',
        type: 'website',
        data: 'https://docs.example.com/guide',
        title: null,
        status: 'ready',
        updatedAt: '2026-09-08T12:00:00.000Z',
      },
      {
        id: 'resource-2',
        type: 'text',
        data: 'http://localhost:4566/explainit/resources/chat-1/resource-2.md',
        title: 'Billing notes',
        status: 'ready',
        updatedAt: '2026-09-07T12:00:00.000Z',
      },
      {
        id: 'resource-3',
        type: 'text',
        data: 'Legacy notes',
        title: null,
        status: 'ready',
      },
    ]);

    expect(
      screen.getByRole('link', { name: 'https://docs.example.com/guide' }),
    ).toHaveAttribute('href', 'https://docs.example.com/guide');
    expect(screen.getByRole('link', { name: 'Billing notes' })).toHaveAttribute(
      'href',
      'http://localhost:4566/explainit/resources/chat-1/resource-2.md',
    );
    expect(screen.getByText('Legacy notes')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Legacy notes' }),
    ).not.toBeInTheDocument();

    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('does not show a Source field on the Add text form', async () => {
    const user = userEvent.setup();
    renderTable([]);

    await user.click(screen.getByRole('button', { name: 'Add text' }));

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
    expect(screen.queryByLabelText('Source')).not.toBeInTheDocument();
  });
});
