import { IconArrowRight } from "@/components/ui/icons";


export function EmptyScreen(props: {
  append: (value: string) => void;
  chatName: string;
  starters: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
        <p className="text-sm leading-normal text-gray-900 dark:text-gray-300">
          Ask anything about {props.chatName}. I can search the docs and API
          reference.
        </p>
        {props.starters.length ? (
          <div className="mt-4 flex flex-col items-start space-y-2">
            {props.starters.map((message, index) => (
              <button
                key={index}
                className="h-auto p-0 text-start text-base font-medium text-gray-900 dark:text-white"
                onClick={() => props.append(message)}
              >
                <span className="">{message}</span>
                <IconArrowRight className="ml-2 h-4 w-4 inline-block text-gray-900 dark:text-gray-300" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
