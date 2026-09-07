import { createFileRoute } from '@tanstack/react-router';
import GenerateLayout from '@/layouts/generate-layout';
import VisibilityForm from '@/components/generate/visibility-form';
import CodeSnippet from '@/components/generate/code-snippet';
import { ensureOwnerWorkspace } from '@/lib/queries';

export const Route = createFileRoute('/_authed/chats/$chatId/setup')({
  loader: ({ context, params }) =>
    ensureOwnerWorkspace(context.queryClient, params.chatId),
  component: ChatSetupPage,
});

function ChatSetupPage() {
  const { user, chat } = Route.useLoaderData();

  return (
    <GenerateLayout user={{ email: user.email }} chat={chat}>
      <div className="space-y-6 text-sm">
        <section className="text-gray-500 dark:text-gray-400 space-y-1 max-w-xl">
          <p>
            Publish the Chat, then paste the Install snippet on every Host
            origin you allowlisted in Settings. www and apex are different
            origins.
          </p>
        </section>

        <section className="border-t border-gray-200 dark:border-white/10 pt-5">
          <VisibilityForm id={chat.id} published={chat.published} />
        </section>

        <section className="border-t border-gray-200 dark:border-white/10 pt-5">
          <CodeSnippet id={chat.id} hostOrigins={chat.hostOrigins} />
        </section>
      </div>
    </GenerateLayout>
  );
}
