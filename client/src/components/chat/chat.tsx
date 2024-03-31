'use client';

import { cn } from '@/lib/utils';
import { ChatList } from '@/components/chat/chat-list';
import { ChatPanel } from '@/components/chat/chat-panel';
import { EmptyScreen } from '@/components/chat/empty-screen';
import { ChatScrollAnchor } from '@/components/chat/chat-scroll-anchor';
import React from 'react';
import useChat from '@/lib/hooks/use-chat';
import { ChatMessage } from '@/lib/services/chat-service';
import { ChatMessageLoading } from './chat-message-loading';
import DeleteMessages from './delete-messages';

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: ChatMessage[];
  id: string;
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const { messages, isLoading, input, setInput, append } = useChat(
    id,
    initialMessages,
  );

  return (
    <div className="relative">
      <div className="h-10 bg-white dark:bg-gray-950 border-b dark:border-b-gray-800 sticky top-16 z-50 left-0 w-screen px-4 md:px-8 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {/* {chat.filename[0].toUpperCase() + chat.filename.slice(1)} */}
          Documentation
        </span>
        <DeleteMessages id={id} />
      </div>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} loading={isLoading} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        id={id}
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
