'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ChatTranscript } from '@/components/chat/chat-transcript';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useChat from '@/lib/hooks/use-chat';
import { ChatMetadataDto } from '@/lib/services/chat-service';

export function PreviewChat(props: {
  chat: ChatMetadataDto;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { messages, isLoading, input, setInput, append, stop } = useChat(
    props.chat.id,
    [],
  );

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? 'default'}
        size={props.size ?? 'sm'}
        className={props.className}
        onClick={() => setOpen(true)}
      >
        Preview
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[min(85dvh,40rem)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="space-y-0 border-b border-gray-200 px-4 py-3 pr-12 text-left dark:border-gray-800">
            <DialogTitle>Ask AI</DialogTitle>
            <DialogDescription className="sr-only">
              Ask questions grounded in this Chat&apos;s resources.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              <ChatTranscript
                chat={props.chat}
                messages={messages}
                isLoading={isLoading}
                append={append}
              />
            </div>
            <ChatPanel
              contained
              isLoading={isLoading}
              append={append}
              stop={stop}
              input={input}
              setInput={setInput}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
