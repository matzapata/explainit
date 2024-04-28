import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Textarea from 'react-textarea-autosize';

import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconArrowElbow } from '@/components/ui/icons';
import { ArrowUpRight } from 'lucide-react';

interface PromptProps {
  onSubmit: (value: string) => unknown;
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
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
      <div className="relative flex mb-2 max-h-60 w-full grow flex-col overflow-hidden bg-white dark:bg-gray-950 dark:border-gray-800 pr-8 sm:rounded-md sm:border sm:pr-12">
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message."
          spellCheck={false}
          className="min-h-[60px] w-full dark:text-white resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
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
      <Link href="/" className="flex space-x-0 justify-center items-center">
        <p className="text-gray-600 text-sm">Powered by explainit.</p>
        <ArrowUpRight className="h-3 w-3 text-gray-600" />
      </Link>
    </form>
  );
}
