import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatMessage, ChatMetadataDto, MessageRole } from '@/lib/services/chat-service';
import { PreviewChat } from './preview-chat';

const { session } = vi.hoisted(() => ({
  session: { messages: [] as ChatMessage[], isLoading: false },
}));

vi.mock('@/lib/hooks/use-chat', () => ({
  default: () => {
    const [messages, setMessages] = useState(session.messages);
    const applyMessages = (
      next: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
    ) => {
      const resolved = typeof next === 'function' ? next(session.messages) : next;
      session.messages = resolved;
      setMessages(resolved);
    };
    return {
      messages,
      setMessages: applyMessages,
      isLoading: session.isLoading,
      input: '',
      setInput: vi.fn(),
      append: async (text: string) => {
        applyMessages([
          ...session.messages,
          { content: text, role: MessageRole.user, context: [] },
        ]);
      },
      stop: vi.fn(),
    };
  },
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

const chat: ChatMetadataDto = {
  id: 'chat-1',
  name: 'Docs',
  conversationStarters: ['How do I start?'],
  published: false,
  points: 0,
  resources: [],
};

function renderPreview() {
  return render(
    <TooltipProvider>
      <PreviewChat chat={chat} />
    </TooltipProvider>,
  );
}

describe('PreviewChat', () => {
  beforeEach(() => {
    session.messages = [];
    session.isLoading = false;
    window.history.replaceState(null, '', '/');
  });

  it('opens an in-page Chat without navigating to the share-link page', async () => {
    const user = userEvent.setup();
    renderPreview();

    expect(
      screen.queryByRole('link', { name: 'Preview' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Preview' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Ask AI' })).toBeVisible();
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Send message' }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'New chat' }),
    ).toBeVisible();
    expect(
      within(dialog).queryByRole('button', { name: /stop generating/i }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByPlaceholderText('Ask a question…'),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('does not show Stop generating while a reply is in progress', async () => {
    session.isLoading = true;
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).queryByRole('button', { name: /stop generating/i }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Send message' }),
    ).toBeVisible();
  });

  it('closes the in-page Chat with Escape and leaves Preview on the same page', async () => {
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('keeps the transcript when Preview is closed and opened again', async () => {
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: /How do I start/ }),
    );

    expect(within(dialog).getByText('How do I start?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    const reopened = await screen.findByRole('dialog');
    expect(within(reopened).getByText('How do I start?')).toBeInTheDocument();
  });

  it('starts a new chat from the plus button and restores the empty transcript', async () => {
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: /How do I start/ }),
    );

    expect(
      within(dialog).queryByText(/Ask anything about Docs/),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'New chat' }));

    expect(
      within(dialog).getByText(/Ask anything about Docs/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /How do I start/ }),
    ).toBeVisible();
  });
});
