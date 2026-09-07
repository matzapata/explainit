'use client';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { CodeBlock } from '../ui/codeblock';
import { MemoizedReactMarkdown } from './markdown';
import { MessageSources } from './chat-message-context';
import {
  ChatMessage as IChatMessage,
  MessageRole,
} from '../../lib/types';

export interface ChatMessageProps {
  message: IChatMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false, ...props }: ChatMessageProps) {
  const isUser = message.role === MessageRole.user;
  const content = isStreaming ? `${message.content}▍` : message.content;

  if (isUser) {
    return (
      <div className="flex justify-end py-3" {...props}>
        <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2.5 dark:bg-white/5">
          <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-start py-3" {...props}>
      <div className="min-w-0 w-full">
        <MemoizedReactMarkdown
          className="break-words text-sm font-normal leading-relaxed text-gray-900 dark:text-gray-300"
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
            strong({ children }) {
              return (
                <strong className="font-medium text-gray-900 dark:text-gray-100">
                  {children}
                </strong>
              );
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
                  <code
                    className="rounded bg-gray-100 px-1 py-px font-mono text-[0.9em] text-gray-800 dark:bg-white/10 dark:text-gray-100"
                    {...props}
                  >
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
      </div>
      {!isStreaming ? <MessageSources context={message.context} /> : null}
    </div>
  );
}
