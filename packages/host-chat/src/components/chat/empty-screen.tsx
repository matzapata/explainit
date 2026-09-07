import { IconArrowRight } from "../ui/icons";


export function EmptyScreen(props: {
  append: (value: string) => void;
  chatName: string;
  starters: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Ask anything about {props.chatName}. I can search the docs and API
        reference.
      </p>
      {props.starters.length ? (
        <div className="mt-4 flex flex-col items-start space-y-2">
          {props.starters.map((message, index) => (
            <button
              key={index}
              className="h-auto p-0 text-start text-sm text-gray-900 hover:underline dark:text-white"
              onClick={() => props.append(message)}
            >
              <span>{message}</span>
              <IconArrowRight className="ml-2 h-4 w-4 inline-block text-gray-400 dark:text-gray-500" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
