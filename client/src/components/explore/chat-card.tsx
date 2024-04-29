import { ChatMetadataDto } from '@/lib/services/chat-service';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function ChatCard(props: { chat: ChatMetadataDto }) {
  return (
    <div className="text-white py-6">
      <p className="hover:underline cursor-pointer ">{props.chat.name}</p>
      <p>{props.chat.description}</p>

      <div className="flex items-center space-x-3 mt-2">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6 rounded-md">
            <AvatarImage className="rounded-md" src={props.chat.logo} />
            <AvatarFallback className="rounded-md text-xs">
              {props.chat.name?.split('')[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex items-center space-x-1">
          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
          <p className="text-sm">{props.chat.points}</p>
        </div>
      </div>
    </div>
  );
}
