import { createFileRoute } from '@tanstack/react-router';
import ResourcesTable from '@/components/generate/resources-table';
import GenerateLayout from '@/layouts/generate-layout';
import { ensureOwnerWorkspace } from '@/lib/queries';

export const Route = createFileRoute('/_authed/chats/$chatId/resources')({
  loader: ({ context, params }) =>
    ensureOwnerWorkspace(context.queryClient, params.chatId),
  component: ChatResourcesPage,
});

function ChatResourcesPage() {
  const { user, chat } = Route.useLoaderData();

  return (
    <GenerateLayout user={{ email: user.email }} chat={chat}>
      <div className="space-y-8">
        <div className="space-y-1 pb-5 border-b dark:border-b-gray-700">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">
            Add data sources to your chat
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Your chatbot will respond only with the information you provide, the
            better the information the better the response we can generate. You
            can load public github repositories, websites, documentation sites,
            and more.
          </p>
        </div>

        <ResourcesTable
          chatId={chat.id}
          initialResources={chat.resources ?? []}
        />
      </div>
    </GenerateLayout>
  );
}
