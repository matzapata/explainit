import { Chat } from '@/components/chat/chat';
import { ChatNavBar } from '@/components/chat/chat-navbar';
import { chatService } from '@/lib/services/chat-service';
import { isAuthenticated } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const authenticated = await isAuthenticated();
  const chat = await chatService.getChat(params.id);

  if (!authenticated && !chat.published) {
    return redirect('/not-found');
  }
  return (
    <div>
      <ChatNavBar authenticated={authenticated} chat={chat} />
      <Chat chat={chat} />;
    </div>
  );
}
