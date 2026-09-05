import { createFileRoute } from '@tanstack/react-router';
import ResourcesTable from '@/components/generate/resources-table';
import GenerateLayout from '@/layouts/generate-layout';
import { ensureOwnerWorkspace } from '@/lib/queries';

export const Route = createFileRoute('/_authed/resources')({
  loader: ({ context }) => ensureOwnerWorkspace(context.queryClient),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { user, chat } = Route.useLoaderData();

  return (
    <GenerateLayout user={{ email: user.email }} chat={chat}>
      <main>
        <div className="py-8 md:py-12 max-w-6xl mx-auto">
          <div className="px-4 md:px-8">
            <div className="space-y-8">
              <h1 className="font-semibold text-2xl md:3xl text-gray-900 dark:text-white">
                Resources
              </h1>

              <div className=" space-y-1 pb-5 border-b dark:border-b-gray-700">
                <h2 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
                  Add data sources to your chat
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Your chatbot will respond only with the information you
                  provide, the better the information the better the response we
                  can generate. You can load public github repositories,
                  websites, documentation sites, and more.
                </p>
              </div>
            </div>

            <ResourcesTable chatId={chat.id} initialResources={chat.resources} />
          </div>
        </div>
      </main>
    </GenerateLayout>
  );
}
