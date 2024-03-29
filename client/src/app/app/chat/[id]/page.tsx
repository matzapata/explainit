import { Chat } from "@/components/chat/chat";
import DeleteMessages from "@/components/chat/delete-messages";
import ChatLayout from "@/layouts/chat-layout";
import { chatService } from "@/lib/services/chat-service";
import { paymentsService } from "@/lib/services/payments-service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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
    chatService.getChat(accessTokenRaw, params.id),
  ]);

  return (
    <ChatLayout user={{ email: user.email, isPro: user.isPro }}>
      <div className="relative">
        <div className="h-10 bg-white dark:bg-gray-950 border-b dark:border-b-gray-800 sticky top-16 z-50 left-0 w-screen px-4 md:px-8 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {chat.filename[0].toUpperCase() + chat.filename.slice(1)}
          </span>
          <DeleteMessages id={params.id} />
        </div>
        <Chat id={params.id} initialMessages={chat.messages} />;
      </div>
    </ChatLayout>
  );
}
