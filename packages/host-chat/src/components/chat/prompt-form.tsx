import { useEffect, useRef } from 'react';
import Textarea from 'react-textarea-autosize';

import { useEnterSubmit } from '../../lib/hooks/use-enter-submit';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { IconArrowElbow } from '../ui/icons';

interface PromptProps {
  onSubmit: (value: string) => unknown;
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  compact?: boolean;
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
  compact = false,
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(input);
      }}
      ref={formRef}
    >
      {compact ? (
        <div className="flex items-center gap-2">
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            minRows={2}
            maxRows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            spellCheck={false}
            className="min-h-16 max-h-40 w-full flex-1 resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm leading-5 focus-within:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || input === ''}
                className="h-10 w-10 shrink-0"
              >
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-white pr-8 dark:border-gray-800 dark:bg-gray-950 sm:rounded-md sm:border sm:pr-12">
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message."
            spellCheck={false}
            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none dark:text-white sm:text-sm"
          />
          <div className="absolute right-0 top-4 sm:right-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || input === ''}
                  className="h-8 w-8"
                >
                  <IconArrowElbow />
                  <span className="sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </form>
  );
}
