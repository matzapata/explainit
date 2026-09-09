import { createFileRoute } from '@tanstack/react-router';
import { ChatOverview } from '@/components/generate/chat-overview';
import GenerateLayout from '@/layouts/generate-layout';
import { ensureOwnerOverview } from '@/lib/queries';

export const Route = createFileRoute('/_authed/chats/$chatId/')({
  loader: ({ context, params }) =>
    ensureOwnerOverview(context.queryClient, params.chatId),
  component: ChatOverviewPage,
});

function ChatOverviewPage() {
  const { user, chat, overview } = Route.useLoaderData();

  return (
    <GenerateLayout user={{ email: user.email }} chat={chat}>
      <ChatOverview chat={chat} overview={overview} />
    </GenerateLayout>
  );
}
