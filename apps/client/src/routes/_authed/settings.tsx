import { createFileRoute } from '@tanstack/react-router';
import EmailForm from '@/components/settings/email-form';
import NameForm from '@/components/settings/name-form';
import SettingsLayout from '@/layouts/settings-layout';
import { queries } from '@/lib/queries';

export const Route = createFileRoute('/_authed/settings')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(queries.user()),
  component: SettingsPage,
});

function SettingsPage() {
  const user = Route.useLoaderData();

  return (
    <SettingsLayout user={{ email: user.email }}>
      <div className="py-8 md:py-12 space-y-8 max-w-6xl mx-auto">
        <div className="px-4 md:px-8">
          <div>
            <h1 className="font-semibold text-2xl md:3xl text-gray-900 dark:text-white">
              General
            </h1>
          </div>
        </div>

        <div className="md:px-8 px-4 ">
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h1 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
              Personal info
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Your profile on this instance.
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <NameForm name={user.name} />
            <EmailForm email={user.email} />
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
