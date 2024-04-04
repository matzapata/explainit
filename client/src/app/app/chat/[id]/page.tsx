import Logo from '@/components/brand/logo';
import { Chat } from '@/components/chat/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chatService } from '@/lib/services/chat-service';
import { paymentsService } from '@/lib/services/payments-service';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { XIcon } from 'lucide-react';
import Link from 'next/link';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();
  const chat = await chatService.getChat(params.id);

  return (
    <div>
      <div
        className={`${authenticated ? 'justify-between' : 'justify-center'} border-b h-16 bg-white px-4 md:px-8 items-center dark:bg-gray-950 border-b-gray-200 dark:border-b-gray-800 flex `}
      >
        {/* Enterprise logo */}
        <Avatar>
          <AvatarImage src={chat.logo} alt={chat.name} />
          <AvatarFallback>{chat.name.slice(0,1).toUpperCase()}</AvatarFallback>
        </Avatar>

        {authenticated && (
          <Link href="/app/generate">
            <XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </Link>
        )}
      </div>
      <Chat chat={chat} />;
    </div>
  );
}
