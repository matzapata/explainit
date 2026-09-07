import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatMetadataDto } from '@/lib/services/chat-service';

const chat: ChatMetadataDto = {
  id: 'chat-1',
  name: 'Demo',
  conversationStarters: [],
  published: true,
  points: 0,
  resources: [],
};

vi.mock('@/lib/hooks/use-chat', () => ({
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

vi.mock('@/lib/router', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/services/chat-service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/services/chat-service')>();
  return {
    ...actual,
    chatService: {
      getChat: vi.fn(async () => chat),
    },
  };
});

import { WidgetApp } from '@/host-frame';

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
