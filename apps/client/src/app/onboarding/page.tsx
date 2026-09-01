import { getAccessToken } from '@/lib/auth/session';
import { chatService } from '@/lib/services/chat-service';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { GeneralInfoStep } from '@/components/onboarding/general-info-step';

export default async function GenerateChat() {
  const accessTokenRaw = await getAccessToken();

  const chat = await chatService.getOwnerChat(accessTokenRaw);

  return (
    <OnboardingLayout step={1} totalSteps={4}>
      <GeneralInfoStep chat={chat} />
    </OnboardingLayout>
  );
}
