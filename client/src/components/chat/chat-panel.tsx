import { PromptForm } from "@/components/chat/prompt-form";
import { ButtonScrollToBottom } from "@/components/chat/button-scroll-to-bottom";
import { ChatMessage } from "@/lib/services/chat-service";

interface ChatPanelProps {
  id: string;
  isLoading: boolean;
  append: (message: string) => void;
  input: string;
  setInput: (value: string) => void;
  messages: ChatMessage[];
}

export function ChatPanel({
  id,
  isLoading,
  append,
  input,
  setInput,
  messages,
}: ChatPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        {/* TODO: stop and regenerate, also retry */}
        {/* <div className="flex h-10 items-center justify-center">
          {isLoading ? (
            <Button
              variant="secondary-gray"
              onClick={() => stop()}
              className="bg-white"
            >
              <IconStop className="mr-2" />
              Stop generating
            </Button>
          ) : (
            messages?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => reload()}
                className="bg-white"
              >
                <IconRefresh className="mr-2" />
                Regenerate response
              </Button>
            )
          )}
        </div> */}
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
