import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatResource } from '@/lib/services/chat-service';
import { chatService } from '@/lib/services/chat-service';
import ResourcesTable from './resources-table';

vi.mock('@/lib/auth/use-session', () => ({
  useAccessToken: () => 'token',
}));

vi.mock('@/lib/services/chat-service', () => ({
  chatService: {
    getOwnerChatById: vi.fn(),
    addTextResource: vi.fn(),
    addWebResource: vi.fn(),
    crawlWebResource: vi.fn(),
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
  beforeEach(() => {
    vi.mocked(chatService.addWebResource).mockReset();
    vi.mocked(chatService.crawlWebResource).mockReset();
    vi.mocked(chatService.deleteResource).mockReset();
  });

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

  it('adds only the entered url when Index only this page is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(chatService.addWebResource).mockResolvedValue([
      {
        id: 'resource-1',
        type: 'website',
        data: 'https://docs.example.com/guide',
        status: 'pending',
      },
    ]);
    renderTable([]);

    await user.click(screen.getByRole('button', { name: 'Add website' }));
    await user.type(
      screen.getByLabelText('Website URL'),
      'https://docs.example.com/guide',
    );
    expect(
      screen.getByRole('radio', { name: 'Index only this page' }),
    ).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(chatService.addWebResource).toHaveBeenCalledWith('token', 'chat-1', [
      'https://docs.example.com/guide',
    ]);
    expect(chatService.crawlWebResource).not.toHaveBeenCalled();
  });

  it('crawls every linked page when that mode is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(chatService.crawlWebResource).mockResolvedValue([
      {
        id: 'resource-1',
        type: 'website',
        data: 'https://docs.example.com/guide',
        status: 'pending',
        crawlId: 'crawl-1',
      },
    ]);
    renderTable([]);

    await user.click(screen.getByRole('button', { name: 'Add website' }));
    await user.type(
      screen.getByLabelText('Website URL'),
      'https://docs.example.com/guide',
    );
    await user.click(
      screen.getByRole('radio', {
        name: 'Index every linked page (depth 16, max 500)',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(chatService.crawlWebResource).toHaveBeenCalledWith(
      'token',
      'chat-1',
      'https://docs.example.com/guide',
      { unlimited: true },
    );
    expect(chatService.addWebResource).not.toHaveBeenCalled();
  });

  it('warns about stopping the crawl when deleting an inflight crawl page', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(chatService.deleteResource).mockResolvedValue('resource-1');

    renderTable([
      {
        id: 'resource-1',
        type: 'website',
        data: 'https://docs.example.com/guide',
        title: null,
        status: 'pending',
        crawlId: 'crawl-1',
      },
      {
        id: 'resource-2',
        type: 'website',
        data: 'https://docs.example.com/guide/a',
        title: null,
        status: 'pending',
        crawlId: 'crawl-1',
      },
      {
        id: 'resource-3',
        type: 'website',
        data: 'https://docs.example.com/ready',
        title: null,
        status: 'ready',
        crawlId: 'crawl-1',
      },
    ]);

    await user.click(
      screen.getAllByRole('button', { name: 'Remove resource' })[0],
    );

    expect(confirm).toHaveBeenCalledWith(
      'Stop this crawl? Other queued pages from this crawl will be removed too. Pages already indexed will stay.',
    );
    expect(chatService.deleteResource).toHaveBeenCalledWith(
      'token',
      'chat-1',
      'resource-1',
    );
    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'https://docs.example.com/guide' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', {
          name: 'https://docs.example.com/guide/a',
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'https://docs.example.com/ready' }),
      ).toBeInTheDocument();
    });

    confirm.mockRestore();
  });

  it('removes the deleted resource from the table after success', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(chatService.deleteResource).mockResolvedValue('chat-1');

    renderTable([
      {
        id: 'resource-1',
        type: 'website',
        data: 'https://docs.example.com/guide',
        title: null,
        status: 'ready',
        updatedAt: '2026-09-08T12:00:00.000Z',
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Remove resource' }));

    expect(chatService.deleteResource).toHaveBeenCalledWith(
      'token',
      'chat-1',
      'resource-1',
    );
    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'https://docs.example.com/guide' }),
      ).not.toBeInTheDocument();
    });

    vi.mocked(window.confirm).mockRestore();
  });
});
