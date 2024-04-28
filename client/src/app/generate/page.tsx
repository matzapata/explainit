import { paymentsService } from '@/lib/services/payments-service';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { chatService } from '@/lib/services/chat-service';
import { Onboarding } from '@/components/onboarding/onboarding';
import { EditChat } from '@/components/generate/edit-chat';

export default async function GenerateChat() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const [user, chat] = await Promise.all([
    paymentsService.getSubscription(accessTokenRaw),
    chatService.getOwnerChat(accessTokenRaw),
  ]);
  console.log("chat", chat, user)

  if (chat.published) return <EditChat chat={chat} user={user} />;
  return <Onboarding chat={chat} />;
}
