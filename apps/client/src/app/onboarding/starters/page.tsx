import { getAccessToken } from '@/lib/auth/session';
import { chatService } from '@/lib/services/chat-service';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { ConversationStartersStep } from '@/components/onboarding/conversation-starters-step';

export default async function GenerateChat() {
  const accessTokenRaw = await getAccessToken();

  const chat = await chatService.getOwnerChat(accessTokenRaw);

  return (
    <OnboardingLayout step={3} totalSteps={4}>
      <ConversationStartersStep chat={chat} />
    </OnboardingLayout>
  );
}
