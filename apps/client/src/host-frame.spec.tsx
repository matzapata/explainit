import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatMetadataDto, MessageRole } from '@/lib/services/chat-service';

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
  const actual = await importOriginal<typeof import('@/lib/services/chat-service')>();
  return {
    ...actual,
    chatService: {
      getChat: vi.fn(async () => chat),
    },
  };
});

import { HostFrameApp } from '@/host-frame';

function renderHost() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <HostFrameApp />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('HostFrameApp', () => {
  beforeEach(() => {
    window.__EXPLAINIT_CHAT_ID__ = 'chat-1';
    vi.stubGlobal('parent', { postMessage: vi.fn() });
  });

  it('opens Ask AI again when the Host page sends page context', async () => {
    const user = userEvent.setup();
    renderHost();

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://docs.example.com',
        data: {
          type: 'explainit:page-context',
          pageUrl: 'https://docs.example.com/guide',
          selectedText: '',
        },
      }),
    );

    expect(await screen.findByRole('dialog')).toBeVisible();
  });
});
