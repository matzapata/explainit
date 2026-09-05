import { PromptForm } from "@/components/chat/prompt-form";
import { ButtonScrollToBottom } from "@/components/chat/button-scroll-to-bottom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Square } from "lucide-react";

interface ChatPanelProps {
  isLoading: boolean;
  append: (message: string) => void;
  stop: () => void;
  input: string;
  setInput: (value: string) => void;
  contained?: boolean;
}

export function ChatPanel({
  isLoading,
  append,
  stop,
  input,
  setInput,
  contained = false,
}: ChatPanelProps) {
  return (
    <div className={contained ? "shrink-0" : "fixed inset-x-0 bottom-0"}>
      {!contained && <ButtonScrollToBottom />}
      <div className={contained ? "px-4" : "mx-auto sm:max-w-2xl sm:px-4"}>
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
        <div
          className={cn(
            "space-y-4 bg-white px-4 py-2 dark:bg-gray-950 md:py-4",
            contained
              ? "border-t dark:border-gray-800"
              : "border-t shadow-lg sm:rounded-t-xl sm:border dark:border-gray-800",
          )}
        >
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
