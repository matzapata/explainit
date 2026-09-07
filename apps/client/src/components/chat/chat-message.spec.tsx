import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChatMessage } from '@/components/chat/chat-message';
import {
  ChatMessage as ChatMessageDto,
  MessageRole,
} from '@/lib/services/chat-service';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderMessage(message: ChatMessageDto) {
  return render(
    <TooltipProvider>
      <ChatMessage message={message} />
    </TooltipProvider>,
  );
}

describe('ChatMessage', () => {
  it('renders inline code with light-theme contrast', () => {
    renderMessage({
      role: MessageRole.ai,
      content: 'Call `createInvitation()` on the Clerk API.',
      context: [],
    });

    const code = screen.getByText('createInvitation()');
    expect(code.tagName).toBe('CODE');
    expect(code).toHaveClass('bg-gray-100');
    expect(code).toHaveClass('text-gray-800');
  });

  it('lists unique source titles below the answer', () => {
    renderMessage({
      role: MessageRole.ai,
      content: 'To create a PaymentIntent, use the Stripe CLI.',
      context: [
        {
          content: 'chunk-a',
          metadata: {
            source: 'https://docs.stripe.com/payments/intents',
            title: 'Payment Intents API',
          },
        },
        {
          content: 'chunk-a-2',
          metadata: {
            source: 'https://docs.stripe.com/payments/intents',
            title: 'Payment Intents API',
          },
        },
        {
          content: 'chunk-b',
          metadata: {
            source: 'https://stripe.com',
            title: 'Stripe',
          },
        },
      ],
    });

    const answer = screen.getByText(
      'To create a PaymentIntent, use the Stripe CLI.',
    );
    const label = screen.getByText('Used 2 sources');
    const sources = label.closest('details');
    expect(sources).not.toHaveAttribute('open');
    expect(label).toHaveClass('text-xs');
    expect(
      answer.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      screen.getByRole('link', { name: 'Payment Intents API' }),
    ).toHaveAttribute('href', 'https://docs.stripe.com/payments/intents');
    expect(screen.getByRole('link', { name: 'Stripe' })).toHaveAttribute(
      'href',
      'https://stripe.com',
    );
    expect(
      screen.queryByRole('button', { name: 'Copy message' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sources' }),
    ).not.toBeInTheDocument();
  });

  it('starts with sources closed and expands from the Used N sources control', async () => {
    const user = userEvent.setup();
    renderMessage({
      role: MessageRole.ai,
      content: 'Refunds are available within 14 days.',
      context: [
        {
          content: 'chunk',
          metadata: {
            source: 'https://example.com/refunds',
            title: 'Refunds',
          },
        },
      ],
    });

    const sources = screen.getByText('Used 1 source').closest('details');
    expect(sources).not.toHaveAttribute('open');

    await user.click(screen.getByText('Used 1 source'));

    expect(sources).toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Refunds' })).toBeVisible();
  });
});
