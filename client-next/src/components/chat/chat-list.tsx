import { ChatMessage } from "@/components/chat/chat-message";
import { ChatMessage as IChatMessage } from "@/lib/services/chat-service";
import { ChatMessageLoading } from "./chat-message-loading";

export function ChatList(props: {
  messages: IChatMessage[];
  loading: boolean;
}) {
  if (!props.messages.length) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 divide-y dark:divide-gray-800">
      {props.messages.map((message, index) => (
        <ChatMessage key={index} message={message} />
      ))}
      {props.loading && <ChatMessageLoading />}
    </div>
  );
}
