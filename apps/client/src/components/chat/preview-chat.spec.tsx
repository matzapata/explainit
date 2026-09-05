import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatMessage, ChatMetadataDto, MessageRole } from '@/lib/services/chat-service';
import { PreviewChat } from './preview-chat';

const { session } = vi.hoisted(() => ({
  session: { messages: [] as ChatMessage[] },
}));

vi.mock('@/lib/hooks/use-chat', () => ({
  default: () => {
    const [messages, setMessages] = useState(session.messages);
    return {
      messages,
      setMessages,
      isLoading: false,
      input: '',
      setInput: vi.fn(),
      append: async (text: string) => {
        const next = [
          ...session.messages,
          { content: text, role: MessageRole.user, context: [] },
        ];
        session.messages = next;
        setMessages(next);
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
  logo: 'https://example.com/logo.png',
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
      within(dialog).getByPlaceholderText('Send a message.'),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
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
});
