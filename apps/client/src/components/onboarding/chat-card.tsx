import { ChatMetadataDto } from '@/lib/services/chat-service';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';

export function ChatCard(props: { chat: ChatMetadataDto }) {
  return (
    <div className="text-white py-6">
      <p>{props.chat.name}</p>
      <p>{props.chat.description}</p>

      <div className="flex items-center space-x-3 mt-2">
        <div className="flex items-center space-x-1">
          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
          <p className="text-sm">{props.chat.points}</p>
        </div>
      </div>
    </div>
  );
}
