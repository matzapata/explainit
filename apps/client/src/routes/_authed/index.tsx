import { createFileRoute } from '@tanstack/react-router';
import { ChatsList } from '@/components/generate/chats-list';
import { queries } from '@/lib/queries';

export const Route = createFileRoute('/_authed/')({
  loader: async ({ context }) => {
    const [user, chats] = await Promise.all([
      context.queryClient.ensureQueryData(queries.user()),
      context.queryClient.ensureQueryData(queries.chats()),
    ]);
    return { user, chats };
  },
  component: HomePage,
});

function HomePage() {
  const { user, chats } = Route.useLoaderData();
  return <ChatsList user={user} chats={chats} />;
}
