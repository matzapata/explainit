import Logo from '@/components/brand/logo';
import { Chat } from '@/components/chat/chat';
import DeleteMessages from '@/components/chat/delete-messages';
import ChatLayout from '@/layouts/chat-layout';
import { chatService } from '@/lib/services/chat-service';
import { paymentsService } from '@/lib/services/payments-service';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

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
      <div className="border-b h-16 bg-white items-center dark:bg-gray-950 border-b-gray-200 dark:border-b-gray-800 flex justify-center">
        {/* Enterprise logo */}
        <Logo />
      </div>
      <Chat id={params.id} initialMessages={chat.messages} />;
    </div>
    
  );
}
