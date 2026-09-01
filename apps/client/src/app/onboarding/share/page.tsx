import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { chatService } from '@/lib/services/chat-service';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { ShareStep } from '@/components/onboarding/share-step';

export default async function GenerateChat() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const chat = await chatService.getOwnerChat(accessTokenRaw);

  return (
    <OnboardingLayout step={4} totalSteps={4}>
      <ShareStep chat={chat} />
    </OnboardingLayout>
  );
}
