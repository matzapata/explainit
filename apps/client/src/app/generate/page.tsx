import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { chatService } from '@/lib/services/chat-service';
import { userService } from '@/lib/services/user-service';
import { EditChat } from '@/components/generate/edit-chat';

export default async function GenerateChat() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const [user, chat] = await Promise.all([
    userService.get(accessTokenRaw),
    chatService.getOwnerChat(accessTokenRaw),
  ]);

  return <EditChat chat={chat} user={user} />;
}
