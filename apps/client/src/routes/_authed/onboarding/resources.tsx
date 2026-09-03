import { createFileRoute } from '@tanstack/react-router';
import { OnboardingLayout } from '@/layouts/onboarding-layout';
import { ResourcesStep } from '@/components/onboarding/resources-step';
import { queries } from '@/lib/queries';

export const Route = createFileRoute('/_authed/onboarding/resources')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(queries.ownerChat()),
  component: OnboardingResourcesPage,
});

function OnboardingResourcesPage() {
  const chat = Route.useLoaderData();

  return (
    <OnboardingLayout step={2} totalSteps={4}>
      <ResourcesStep chat={chat} />
    </OnboardingLayout>
  );
}
