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
      <ResourcesTable
        chatId={chat.id}
        initialResources={chat.resources ?? []}
      />
    </GenerateLayout>
  );
}
