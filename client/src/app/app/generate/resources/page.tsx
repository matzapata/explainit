import GoProBanner from '@/components/billing/go-pro-banner';
import ResourcesTable from '@/components/generate/resources-table';
import GenerateLayout from '@/layouts/generate-layout';
import { chatService } from '@/lib/services/chat-service';
import { paymentsService } from '@/lib/services/payments-service';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export default async function ChatResources() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const [user, chat] = await Promise.all([
    paymentsService.getSubscription(accessTokenRaw),
    chatService.getOwnerChat(accessTokenRaw),
  ]);

  return (
    <GenerateLayout user={{ email: user.email, isPro: user.isPro }} chatId={chat.id}>
      <main>
        <div className="pt-12 pb-24 max-w-6xl mx-auto">
          {!user.isPro && <GoProBanner />}

          {/* Heading */}
          <div className="px-4 md:px-8 mt-8">
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

            <ResourcesTable initialResources={chat.resources} />
          </div>
        </div>
      </main>
    </GenerateLayout>
  );
}
