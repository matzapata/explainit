import { ChatList } from './chat-list';
import { ChatScrollAnchor } from './chat-scroll-anchor';
import { EmptyScreen } from './empty-screen';
import { ChatMessage, ChatMetadata } from '../../lib/types';

export function ChatTranscript(props: {
  chat: ChatMetadata;
  messages: ChatMessage[];
  isLoading: boolean;
  append: (value: string) => void;
}) {
  if (props.messages.length) {
    return (
      <>
        <ChatList messages={props.messages} loading={props.isLoading} />
        <ChatScrollAnchor trackVisibility={props.isLoading} />
      </>
    );
  }

  return (
    <EmptyScreen
      append={props.append}
      chatName={props.chat.name ?? 'Untitled Chat'}
      starters={props.chat.conversationStarters}
    />
  );
}
