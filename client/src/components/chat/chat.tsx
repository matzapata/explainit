'use client';

import { cn } from '@/lib/utils';
import { ChatList } from '@/components/chat/chat-list';
import { ChatPanel } from '@/components/chat/chat-panel';
import { EmptyScreen } from '@/components/chat/empty-screen';
import { ChatScrollAnchor } from '@/components/chat/chat-scroll-anchor';
import React from 'react';
import useChat from '@/lib/hooks/use-chat';
import {
  ChatMetadataDto,
  MessageRole,
} from '@/lib/services/chat-service';
import DeleteMessages from './delete-messages';
import Link from 'next/link';

export interface ChatProps extends React.ComponentProps<'div'> {
  chat: ChatMetadataDto;
}

export function Chat({ chat, className }: ChatProps) {
  const { messages, setMessages, isLoading, input, setInput, append } = useChat(
    chat.id,
    [
      {
        content: 'Hi',
        role: MessageRole.user,
        context: [{ pageContent: 'string', metadata: 'any' }],
      },
      {
        content: 'Bie',
        role: MessageRole.ai,
        context: [{ pageContent: 'string', metadata: 'any' }],
      },
    ],
  );

  return (
    <div className="relative">
      <div className="h-10 bg-white dark:bg-gray-950 border-b dark:border-b-gray-800 sticky top-16 z-50 left-0 w-screen px-4 md:px-8 flex items-center justify-between">
        <Link
          href={chat.url}
          className="text-sm font-medium text-gray-600 dark:text-gray-300"
        >
          Documentation
        </Link>
        <DeleteMessages
          disabled={!messages.length}
          clearMessages={() => setMessages([])}
        />
      </div>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} loading={isLoading} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen
            setInput={setInput}
            chatName={chat.name}
            starters={chat.conversationStarters}
          />
        )}
      </div>
      <ChatPanel
        id={chat.id}
        isLoading={isLoading}
        append={append}
        messages={messages}
        input={input}
        setInput={setInput}
      />
      <div />
    </div>
  );
}
