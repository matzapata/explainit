'use client';

import { cn } from '@/lib/utils';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ChatTranscript } from '@/components/chat/chat-transcript';
import React from 'react';
import useChat from '@/lib/hooks/use-chat';
import { ChatMetadataDto } from '@/lib/services/chat-service';
import { Link } from '@/lib/router';
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
          className="text-gray-600 dark:text-gray-300 text-sm px-0"
        >
          Delete messages
        </Button>
      </div>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        <ChatTranscript
          chat={chat}
          messages={messages}
          isLoading={isLoading}
          append={append}
        />
      </div>
      <ChatPanel
        isLoading={isLoading}
        append={append}
        input={input}
        setInput={setInput}
      />
      <div />
    </div>
  );
}
