'use client';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/codeblock';
import { MemoizedReactMarkdown } from '@/components/chat/markdown';
import { IconOpenAI, IconUser } from '@/components/ui/icons';
import { ChatMessageActions } from '@/components/chat/chat-message-actions';
import {
  ChatMessage as IChatMessage,
  MessageRole,
} from '@/lib/services/chat-service';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { useState } from 'react';

export interface ChatMessageProps {
  message: IChatMessage;
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  return (
    <div
      className={cn('group relative py-4 md:py-8 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border dark:border-gray-800 shadow',
          message.role === MessageRole.user
            ? 'bg-white dark:bg-gray-950'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {message.role === MessageRole.user ? <IconUser className='text-gray-300'/> : <IconOpenAI className='text-gray-300' />}
      </div>
      <div className="ml-4 flex flex-1 overflow-hidden px-1">
        <div className="flex-1 space-y-3  pt-1">
          <MemoizedReactMarkdown
            className="prose break-words dark:text-white dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 flex-1"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              code({ node, inline, className, children, ...props }) {
                if (children?.length) {
                  if (children[0] == '▍') {
                    return (
                      <span className="mt-1 animate-pulse cursor-default">
                        ▍
                      </span>
                    );
                  }

                  children[0] = (children[0] as string).replace('`▍`', '▍');
                }

                const match = /language-(\w+)/.exec(className || '');

                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ''}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                );
              },
            }}
          >
            {message.content}
          </MemoizedReactMarkdown>
          {message.context.length? (
            <ResponseContextDrawer context={message.context} />
          ) : null}
        </div>

        <ChatMessageActions message={message} />
      </div>
    </div>
  );
}

function ResponseContextDrawer(props: {
  context: { pageContent: string; metadata: any }[];
}) {
  const [page, setPage] = useState(0);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="text-xs text-gray-600 hover:underline">
          Show context
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-3xl">
          <DrawerHeader>
            <DrawerTitle className="text-left">Response context</DrawerTitle>
            <DrawerDescription className="text-left">
              The response was generated with the following content from your
              file
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-10 max-h-44 overflow-scroll">
            <p>{props.context[page].pageContent}</p>
          </div>

          <div className="px-4 py-4 space-x-2">
            <Button
              variant={'secondary-gray'}
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant={'secondary-gray'}
              size="sm"
              disabled={page === props.context.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
