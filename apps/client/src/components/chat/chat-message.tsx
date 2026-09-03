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
import { ResponseContextDrawer } from './chat-message-context';

export interface ChatMessageProps {
  message: IChatMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false, ...props }: ChatMessageProps) {
  const content = isStreaming ? `${message.content}▍` : message.content;

  return (
    <div
      className={cn('group relative py-4 md:py-8 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border dark:border-gray-800 shadow bg-white dark:bg-gray-950'
        )}
      >
        {message.role === MessageRole.user ? (
          <IconUser className="text-gray-300" />
        ) : (
          <IconOpenAI className="text-gray-300" />
        )}
      </div>
      <div className="ml-4 flex flex-1 overflow-hidden px-1">
        <div className="flex-1 space-y-3  pt-1">
          <MemoizedReactMarkdown
            className="prose break-words dark:text-white dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 flex-1"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                if (children.length) {
                  return (
                    <p className="mb-2 last:mb-0">
                      {children.map((c, i) => (
                        <span key={i}>{c}</span>
                      ))}
                    </p>
                  );
                } else return <p className="mb-2 last:mb-0">{children}</p>;
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
                    <code className={"bg-gray-800 px-0.5"} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    language={(match && match[1]) || ''}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                );
              },
            }}
          >
            {content}
          </MemoizedReactMarkdown>
          {!isStreaming && message.context.length ? (
            <ResponseContextDrawer context={message.context} />
          ) : null}
        </div>

        {!isStreaming ? <ChatMessageActions message={message} /> : null}
      </div>
    </div>
  );
}
