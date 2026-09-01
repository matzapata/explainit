import { getAccessToken } from '@/lib/auth/session';
import { chatService } from '@/lib/services/chat-service';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { ShareStep } from '@/components/onboarding/share-step';

export default async function GenerateChat() {
  const accessTokenRaw = await getAccessToken();

  const chat = await chatService.getOwnerChat(accessTokenRaw);

  return (
    <OnboardingLayout step={4} totalSteps={4}>
      <ShareStep chat={chat} />
    </OnboardingLayout>
  );
}
