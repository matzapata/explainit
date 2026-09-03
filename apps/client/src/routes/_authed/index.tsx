import { createFileRoute } from '@tanstack/react-router';
import { EditChat } from '@/components/generate/edit-chat';
import { ensureOwnerWorkspace } from '@/lib/queries';

export const Route = createFileRoute('/_authed/')({
  loader: ({ context }) => ensureOwnerWorkspace(context.queryClient),
  component: HomePage,
});

function HomePage() {
  const { user, chat } = Route.useLoaderData();
  return <EditChat chat={chat} user={user} />;
}
