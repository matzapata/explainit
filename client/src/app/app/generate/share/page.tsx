import GoProBanner from '@/components/billing/go-pro-banner';
import CreateChat from '@/components/generate/create-chat';
import { Button } from '@/components/ui/button';
import GenerateLayout from '@/layouts/generate-layout';
import { paymentsService } from '@/lib/services/payments-service';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export default async function Chats() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const accessTokenRaw = await getAccessTokenRaw();

  const [user] = await Promise.all([
    paymentsService.getSubscription(accessTokenRaw),
  ]);

  return (
    <GenerateLayout user={{ email: user.email, isPro: user.isPro }}>
      <main>
        <div className="pt-12 pb-24 max-w-6xl mx-auto">
          <GoProBanner />

          {/* Heading */}
          <div className="px-4 md:px-8 space-y-8 mt-8">
            <h1 className="font-semibold text-2xl md:3xl text-gray-900 dark:text-white">
              Share
            </h1>

            <div className=" space-y-1 pb-5 border-b dark:border-b-gray-700">
              <h2 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
                Your documentation is ready!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Share your documentation with the world! You can use the link
                below to share it with your users.
              </p>
            </div>
          </div>

          <div className="px-4 md:px-8 mt-8">
            <div className="flex border border-gray-700 rounded-lg items-center py-1 pl-4 pr-1">
              <p className="flex-1 text-white">
                https://explainit.com/lanchain
              </p>
              <Button size="sm">Copy link</Button>
            </div>
          </div>
        </div>
      </main>
    </GenerateLayout>
  );
}
