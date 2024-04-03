import CreateChat from "@/components/generate/create-chat";
import GenerateLayout from "@/layouts/generate-layout";
import { chatService } from "@/lib/services/chat-service";
import { paymentsService } from "@/lib/services/payments-service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function ChatResources() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const [user, chat] = await Promise.all([
    paymentsService.getSubscription(accessTokenRaw),
    chatService.getOwnerChat(accessTokenRaw),
  ]);

  return (
    <GenerateLayout user={{ email: user.email, isPro: user.isPro }}>
      <CreateChat initialResources={chat.resources} />
    </GenerateLayout>
  );
}
