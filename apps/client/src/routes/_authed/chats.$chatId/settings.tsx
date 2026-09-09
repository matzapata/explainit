import { createFileRoute } from '@tanstack/react-router';
import { EditChat } from '@/components/generate/edit-chat';
import { ensureOwnerWorkspace } from '@/lib/queries';

export const Route = createFileRoute('/_authed/chats/$chatId/settings')({
  loader: ({ context, params }) =>
    ensureOwnerWorkspace(context.queryClient, params.chatId),
  component: ChatSettingsPage,
});

function ChatSettingsPage() {
  const { user, chat } = Route.useLoaderData();
  return <EditChat chat={chat} user={user} />;
}
