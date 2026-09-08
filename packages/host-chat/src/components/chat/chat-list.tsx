// biome-ignore-all lint/suspicious/noArrayIndexKey: messages have no stable id
import { type ChatMessage as IChatMessage, MessageRole } from '../../lib/types';
import { ChatMessage } from './chat-message';
import { ChatMessageLoading } from './chat-message-loading';

export function ChatList(props: {
  messages: IChatMessage[];
  loading: boolean;
}) {
  if (!props.messages.length) {
    return null;
  }

  const last = props.messages[props.messages.length - 1];
  const showLoading = props.loading && last?.role !== MessageRole.ai;

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {props.messages.map((message, index) => (
        <ChatMessage
          key={index}
          message={message}
          isStreaming={
            props.loading &&
            index === props.messages.length - 1 &&
            message.role === MessageRole.ai
          }
        />
      ))}
      {showLoading && <ChatMessageLoading />}
    </div>
  );
}
