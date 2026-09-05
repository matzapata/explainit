import { ChatList } from '@/components/chat/chat-list';
import { ChatScrollAnchor } from '@/components/chat/chat-scroll-anchor';
import { EmptyScreen } from '@/components/chat/empty-screen';
import {
  ChatMessage,
  ChatMetadataDto,
} from '@/lib/services/chat-service';

export function ChatTranscript(props: {
  chat: ChatMetadataDto;
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
