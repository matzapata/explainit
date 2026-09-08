import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from './components/ui/tooltip';
import type { ChatMetadata } from './lib/types';

const chat: ChatMetadata = {
  id: 'chat-1',
  name: 'Demo',
  conversationStarters: [],
};

vi.mock('./lib/hooks/use-chat', () => ({
  default: () => ({
    messages: [],
    setMessages: vi.fn(),
    isLoading: false,
    input: '',
    setInput: vi.fn(),
    append: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock('./lib/visitor-api', () => ({
  getChat: vi.fn(async () => chat),
}));

import { WidgetApp } from './widget';

function renderWidget() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <WidgetApp chatId="chat-1" />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('WidgetApp', () => {
  beforeEach(() => {
    window.__EXPLAINIT_WIDGET__ = true;
    window.__EXPLAINIT_API_BASE__ = 'https://api.example.com';
  });

  it('opens Ask AI overlay for the chat', async () => {
    renderWidget();

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();
  });

  it('calls onClose when the dialog is closed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <WidgetApp chatId="chat-1" onClose={onClose} />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
