import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";


export function EmptyScreen(props: {
  setInput: (value: string) => void;
  chatName: string;
  starters: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-950 p-8">
        <h1 className="mb-2 text-lg font-semibold dark:text-white">Chat with {props.chatName}</h1>
        <p className="leading-normal text-gray-900 dark:text-gray-300">
          Ask me anything about our products, services, or anything else you need help with. I'm here to help!
        </p>

        {props.starters.length ? (
          <p className="leading-normal text-gray-900 dark:text-gray-300 mt-4">
            You can start a conversation here or try the following examples:
          </p>
        ) : null}
        <div className="mt-4 flex flex-col items-start space-y-2">
          {props.starters.map((message, index) => (
            <Button
              key={index}
              variant="link-gray"
              className="h-auto p-0 text-base"
              onClick={() => props.setInput(message)}
            >
              <IconArrowRight className="mr-2 text-gray-900 dark:text-gray-300" />
              {message}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
