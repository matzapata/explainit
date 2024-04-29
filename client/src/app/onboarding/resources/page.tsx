import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { chatService } from '@/lib/services/chat-service';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { GeneralInfoStep } from '@/components/onboarding/general-info-step';
import { ResourcesStep } from '@/components/onboarding/resources-step';

//   const [step, setStep] = useState(
//     props.chat.name && props.chat.description && props.chat.url
//       ? props.chat.resources.length
//         ? props.chat.conversationStarters.length
//           ? 4
//           : 3
//         : 2
//       : 1,
//   );

export default async function GenerateChat() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const chat = await chatService.getOwnerChat(accessTokenRaw);

  return (
    <OnboardingLayout step={2} totalSteps={4}>
      <ResourcesStep chat={chat} />
    </OnboardingLayout>
  );
}
