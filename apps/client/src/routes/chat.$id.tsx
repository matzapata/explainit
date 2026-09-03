import { createFileRoute, notFound } from '@tanstack/react-router';
import { Chat } from '@/components/chat/chat';
import { ChatNavBar } from '@/components/chat/chat-navbar';
import { getAccessToken } from '@/lib/auth/config';
import { queries } from '@/lib/queries';

export const Route = createFileRoute('/chat/$id')({
  loader: async ({ context, params }) => {
    const chat = await context.queryClient.ensureQueryData(
      queries.chat(params.id),
    );
    const authenticated =
      context.authMode === 'none' ? true : Boolean(getAccessToken());

    if (!authenticated && !chat.published) {
      throw notFound();
    }

    return { chat, authenticated };
  },
  component: ChatPage,
});

function ChatPage() {
  const { chat, authenticated } = Route.useLoaderData();

  return (
    <div>
      <ChatNavBar authenticated={authenticated} chat={chat} />
      <Chat chat={chat} />
    </div>
  );
}
