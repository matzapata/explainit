'use client';

import {
  ChatPanel,
  ChatTranscript,
  HostThemeRoot,
  useChat,
} from '@explainit/host-chat';
import type React from 'react';
import { getAccessToken } from '@/lib/auth/config';
import { Link } from '@/lib/router';
import type { ChatMetadataDto } from '@/lib/services/chat-service';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export interface ChatProps extends React.ComponentProps<'div'> {
  chat: ChatMetadataDto;
}

export function Chat({ chat, className }: ChatProps) {
  const { messages, setMessages, isLoading, input, setInput, append } = useChat(
    chat.id,
    [],
    undefined,
    getAccessToken() || undefined,
  );

  return (
    <HostThemeRoot theme="dark">
      <div className="relative">
        <div className="h-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-white/10 sticky top-16 z-50 left-0 w-screen px-4 md:px-8 flex items-center justify-between">
          <Link
            href={chat.hostOrigins?.[0] ?? '#'}
            className="text-sm font-medium text-gray-500 dark:text-gray-400"
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
            className="text-gray-500 dark:text-gray-400 text-sm px-0"
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
    </HostThemeRoot>
  );
}
