import { ChatsTable } from '@/components/explore/chats-table';
import Navbar from '@/components/navbar/explore';
import { chatService } from '@/lib/services/chat-service';

export default async function Explore() {
  const chats = await chatService.getPublicChats();

  return (
    <div>
      <Navbar />

      <ChatsTable chats={chats} />
    </div>
  );
}
