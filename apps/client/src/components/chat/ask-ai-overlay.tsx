'use client';

import { ChatPanel } from '@/components/chat/chat-panel';
import { ChatTranscript } from '@/components/chat/chat-transcript';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import useChat from '@/lib/hooks/use-chat';
import { ChatMetadataDto } from '@/lib/services/chat-service';

export type PageContext = {
  pageUrl?: string;
  selectedText?: string;
};

export function AskAiOverlay(props: {
  chat: ChatMetadataDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageContext?: PageContext;
}) {
  const { messages, setMessages, isLoading, input, setInput, append, stop } =
    useChat(props.chat.id, [], props.pageContext);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        hideClose
        className="flex h-[min(85dvh,40rem)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"
      >
        <DialogHeader className="relative flex h-11 flex-row items-center space-y-0 border-b border-gray-200 px-4 pr-16 text-left sm:text-left dark:border-gray-800">
          <DialogTitle className="text-sm font-medium">Ask AI</DialogTitle>
          <DialogDescription className="sr-only">
            Ask questions grounded in this Chat&apos;s resources.
          </DialogDescription>
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                stop();
                setMessages([]);
                setInput('');
              }}
              className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:text-white dark:ring-offset-gray-950 dark:focus:ring-gray-300"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">New chat</span>
            </button>
            <DialogClose className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:text-white dark:ring-offset-gray-950 dark:focus:ring-gray-300">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
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
            input={input}
            setInput={setInput}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
