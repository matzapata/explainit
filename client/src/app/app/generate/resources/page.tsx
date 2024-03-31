import CreateChat from "@/components/generate/create-chat";
import GenerateLayout from "@/layouts/generate-layout";
import { paymentsService } from "@/lib/services/payments-service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function Chats() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const [user] = await Promise.all([
    paymentsService.getSubscription(accessTokenRaw),
  ]);

  return (
    <GenerateLayout user={{ email: user.email, isPro: user.isPro }}>
      <CreateChat initialResources={[]} />
    </GenerateLayout>
  );
}
