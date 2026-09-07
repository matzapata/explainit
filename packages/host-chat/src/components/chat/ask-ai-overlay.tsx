'use client';

import { ChatPanel } from './chat-panel';
import { ChatTranscript } from './chat-transcript';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Plus, X } from 'lucide-react';
import useChat from '../../lib/hooks/use-chat';
import { ChatMetadata } from '../../lib/types';

export type PageContext = {
  pageUrl?: string;
  selectedText?: string;
};

export function AskAiOverlay(props: {
  chat: ChatMetadata;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageContext?: PageContext;
  accessToken?: string;
}) {
  const { messages, setMessages, isLoading, input, setInput, append, stop } =
    useChat(props.chat.id, [], props.pageContext, props.accessToken);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        hideClose
        className="flex h-[min(85dvh,40rem)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-lg"
      >
        <DialogHeader className="relative flex h-11 flex-row items-center space-y-0 border-b border-gray-200 px-4 pr-16 text-left sm:text-left dark:border-white/10">
          <DialogTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Ask AI
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ask questions grounded in this Chat&apos;s resources.
          </DialogDescription>
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                stop();
                setMessages([]);
                setInput('');
              }}
              className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">New chat</span>
            </button>
            <DialogClose className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
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
