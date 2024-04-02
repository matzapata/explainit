import Logo from '@/components/brand/logo';
import { Chat } from '@/components/chat/chat';
import { paymentsService } from '@/lib/services/payments-service';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { XIcon } from 'lucide-react';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const [user, chat] = await Promise.all([
    paymentsService.getSubscription(accessTokenRaw),
    // chatService.getChat(accessTokenRaw, params.id),
    Promise.resolve({
      filename: 'chat',
      messages: [],
    }),
  ]);

  return (
    <div>
      <div
        className={`${accessTokenRaw ? 'justify-between' : 'justify-center'} border-b h-16 bg-white px-4 md:px-8 items-center dark:bg-gray-950 border-b-gray-200 dark:border-b-gray-800 flex `}
      >
        {/* Enterprise logo */}
        <Logo />
        {accessTokenRaw && (
          <button>
            <XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>
      <Chat id={params.id} initialMessages={chat.messages} />;
    </div>
  );
}
