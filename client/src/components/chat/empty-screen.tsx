import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";

const exampleMessages: { heading: string; message: string }[] = [];

export function EmptyScreen({
  setInput,
}: {
  setInput: (value: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-950 p-8">
        <h1 className="mb-2 text-lg font-semibold dark:text-white">Welcome to Chatwith!</h1>
        <p className="leading-normal text-gray-900 dark:text-gray-300">
          Make questions about your file and get exactly what you need.
        </p>

        {exampleMessages.length ? (
          <p className="leading-normal text-gray-900">
            You can start a conversation here or try the following examples:
          </p>
        ) : null}
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link-gray"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-gray-900" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
