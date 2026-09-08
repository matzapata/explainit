import { cn } from '../../lib/utils';
import { ButtonScrollToBottom } from './button-scroll-to-bottom';
import { PromptForm } from './prompt-form';

interface ChatPanelProps {
  isLoading: boolean;
  append: (message: string) => void;
  input: string;
  setInput: (value: string) => void;
  contained?: boolean;
}

export function ChatPanel({
  isLoading,
  append,
  input,
  setInput,
  contained = false,
}: ChatPanelProps) {
  return (
    <div className={contained ? 'shrink-0' : 'fixed inset-x-0 bottom-0'}>
      {!contained && <ButtonScrollToBottom />}
      <div className={cn(!contained && 'mx-auto sm:max-w-2xl sm:px-4')}>
        <div
          className={cn(
            contained
              ? 'border-t border-gray-200 bg-transparent px-4 py-3 dark:border-white/10'
              : 'space-y-4 border-t border-gray-200 bg-white px-4 py-2 dark:border-white/10 dark:bg-gray-950 sm:border md:py-4',
          )}
        >
          <PromptForm
            onSubmit={(v) => append(v)}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            compact={contained}
          />
        </div>
      </div>
    </div>
  );
}
