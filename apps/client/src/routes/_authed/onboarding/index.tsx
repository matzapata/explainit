import { createFileRoute } from '@tanstack/react-router';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { GeneralInfoStep } from '@/components/onboarding/general-info-step';
import { queries } from '@/lib/queries';

export const Route = createFileRoute('/_authed/onboarding/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(queries.ownerChat()),
  component: OnboardingPage,
});

function OnboardingPage() {
  const chat = Route.useLoaderData();

  return (
    <OnboardingLayout step={1} totalSteps={4}>
      <GeneralInfoStep chat={chat} />
    </OnboardingLayout>
  );
}
