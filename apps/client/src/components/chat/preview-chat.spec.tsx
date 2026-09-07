import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatMetadataDto } from '@/lib/services/chat-service';
import { PreviewChat } from './preview-chat';

vi.mock('@explainit/host-chat', () => ({
  AskAiOverlay: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    if (!open) {
      return null;
    }
    return (
      <div role="dialog">
        <h2>Ask AI</h2>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
    );
  },
}));

vi.mock('@/lib/auth/config', () => ({
  getAccessToken: () => 'none',
}));

const chat: ChatMetadataDto = {
  id: 'chat-1',
  name: 'Docs',
  conversationStarters: ['How do I start?'],
  published: false,
  points: 0,
  resources: [],
};

describe('PreviewChat', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('opens an in-page Chat without navigating to the share-link page', async () => {
    const user = userEvent.setup();
    render(<PreviewChat chat={chat} />);

    expect(
      screen.queryByRole('link', { name: 'Preview' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Ask AI' })).toBeVisible();
    expect(window.location.pathname).toBe('/');
  });

  it('closes the in-page Chat and leaves Preview on the same page', async () => {
    const user = userEvent.setup();
    render(<PreviewChat chat={chat} />);

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });
});
