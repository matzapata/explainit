import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ChatMessage, MessageRole } from '../../lib/types';
import { TooltipProvider } from '../ui/tooltip';
import { AskAiOverlay } from './ask-ai-overlay';

const { session } = vi.hoisted(() => ({
  session: { messages: [] as ChatMessage[], isLoading: false },
}));

vi.mock('../../lib/hooks/use-chat', () => ({
  default: () => {
    const [messages, setMessages] = useState(session.messages);
    const applyMessages = (
      next: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
    ) => {
      const resolved =
        typeof next === 'function' ? next(session.messages) : next;
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

const chat = {
  id: 'chat-1',
  name: 'Docs',
  conversationStarters: ['How do I start?'],
};

function OverlayHarness() {
  const [open, setOpen] = useState(true);
  return (
    <TooltipProvider>
      <AskAiOverlay chat={chat} open={open} onOpenChange={setOpen} />
    </TooltipProvider>
  );
}

describe('AskAiOverlay', () => {
  beforeEach(() => {
    session.messages = [];
    session.isLoading = false;
  });

  it('renders Ask AI without a brand mark', async () => {
    render(<OverlayHarness />);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Ask AI' }),
    ).toBeVisible();
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Send message' }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'New chat' }),
    ).toBeVisible();
    expect(
      within(dialog).getByPlaceholderText('Ask a question…'),
    ).toBeInTheDocument();
  });

  it('uses outlined send chrome instead of a filled primary button', async () => {
    render(<OverlayHarness />);

    const send = await screen.findByRole('button', { name: 'Send message' });
    expect(send).toHaveClass('bg-transparent');
    expect(send).not.toHaveClass('bg-primary');
  });

  it('does not show Stop generating while a reply is in progress', async () => {
    session.isLoading = true;
    render(<OverlayHarness />);
    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).queryByRole('button', { name: /stop generating/i }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Send message' }),
    ).toBeVisible();
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    render(<OverlayHarness />);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('starts a new chat from the plus button and restores the empty transcript', async () => {
    const user = userEvent.setup();
    render(<OverlayHarness />);
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
