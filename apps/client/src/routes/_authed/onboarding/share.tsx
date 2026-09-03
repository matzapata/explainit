import { createFileRoute } from '@tanstack/react-router';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { ShareStep } from '@/components/onboarding/share-step';
import { queries } from '@/lib/queries';

export const Route = createFileRoute('/_authed/onboarding/share')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(queries.ownerChat()),
  component: OnboardingSharePage,
});

function OnboardingSharePage() {
  const chat = Route.useLoaderData();

  return (
    <OnboardingLayout step={4} totalSteps={4}>
      <ShareStep chat={chat} />
    </OnboardingLayout>
  );
}
