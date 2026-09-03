import { PromptForm } from "@/components/chat/prompt-form";
import { ButtonScrollToBottom } from "@/components/chat/button-scroll-to-bottom";
import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";

interface ChatPanelProps {
  isLoading: boolean;
  append: (message: string) => void;
  stop: () => void;
  input: string;
  setInput: (value: string) => void;
}

export function ChatPanel({
  isLoading,
  append,
  stop,
  input,
  setInput,
}: ChatPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 ">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        {isLoading ? (
          <div className="flex h-10 items-center justify-center">
            <Button
              variant="outline"
              onClick={stop}
              className="bg-white dark:bg-gray-950"
            >
              <Square className="mr-2 h-3 w-3 fill-current" />
              Stop generating
            </Button>
          </div>
        ) : null}
        <div className="space-y-4 border-t bg-white dark:bg-gray-950 dark:border-gray-800 px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            onSubmit={(v) => append(v)}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
