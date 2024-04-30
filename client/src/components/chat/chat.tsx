'use client';

import { cn } from '@/lib/utils';
import { ChatList } from '@/components/chat/chat-list';
import { ChatPanel } from '@/components/chat/chat-panel';
import { EmptyScreen } from '@/components/chat/empty-screen';
import { ChatScrollAnchor } from '@/components/chat/chat-scroll-anchor';
import React from 'react';
import useChat from '@/lib/hooks/use-chat';
import { ChatMetadataDto, MessageRole } from '@/lib/services/chat-service';
import Link from 'next/link';
import { Button } from '../ui/button';

export interface ChatProps extends React.ComponentProps<'div'> {
  chat: ChatMetadataDto;
}

export function Chat({ chat, className }: ChatProps) {
  const { messages, setMessages, isLoading, input, setInput, append } = useChat(
    chat.id,
    [],
  );

  return (
    <div className="relative">
      <div className="h-10 bg-white dark:bg-gray-950 border-b dark:border-b-gray-800 sticky top-16 z-50 left-0 w-screen px-4 md:px-8 flex items-center justify-between">
        <Link
          href={chat.url ?? "#"}
          className="text-sm font-medium text-gray-600 dark:text-gray-300"
        >
          Documentation
        </Link>

        <Button
          disabled={!messages.length}
          onClick={() => {
            if (
              !window.confirm(
                'Are you sure you want to delete all messages? There is no undo.',
              )
            )
              return;
            setMessages([]);
          }}
          variant={'link'}
          size={'sm'}
          className="text-gray-600 dark:text-gray-300"
        >
          Delete messages
        </Button>
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
            chatName={chat.name ?? "Untitled Chat"}
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
