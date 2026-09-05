import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatMetadataDto } from '@/lib/services/chat-service';
import { PreviewChat } from './preview-chat';

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
    expect(
      within(dialog).queryByRole('link', { name: /\/chat\/chat-1/ }),
    ).not.toBeInTheDocument();
  });

  it('closes the in-page Chat and leaves Preview on the same page', async () => {
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
  });
});
