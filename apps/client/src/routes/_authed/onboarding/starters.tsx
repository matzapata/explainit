import { createFileRoute } from '@tanstack/react-router';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { ConversationStartersStep } from '@/components/onboarding/conversation-starters-step';
import { queries } from '@/lib/queries';

export const Route = createFileRoute('/_authed/onboarding/starters')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(queries.ownerChat()),
  component: OnboardingStartersPage,
});

function OnboardingStartersPage() {
  const chat = Route.useLoaderData();

  return (
    <OnboardingLayout step={3} totalSteps={4}>
      <ConversationStartersStep chat={chat} />
    </OnboardingLayout>
  );
}
