import NameForm from '@/components/generate/name-form';
import LogoForm from '@/components/generate/logo-form';
import GenerateLayout from '@/layouts/generate-layout';
import { paymentsService } from '@/lib/services/payments-service';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import WebsiteForm from '@/components/generate/website-form';
import { Button } from '@/components/ui/button';
import { XMarkIcon } from '@heroicons/react/24/solid';
import GoProBanner from '@/components/billing/go-pro-banner';

export default async function Profile() {
  const { getAccessTokenRaw } = getKindeServerSession();
  const user = await paymentsService.getSubscription(await getAccessTokenRaw());

  return (
    <GenerateLayout user={{ email: user.email, isPro: user.isPro }}>
      <div className="py-8 md:py-12 space-y-8 max-w-6xl mx-auto">
        {/* Go pro */}
        <GoProBanner />

        {/* Heading */}
        <div className="px-4 md:px-8">
          <div>
            <h1 className="font-semibold text-2xl md:3xl text-gray-900 dark:text-white">
              General
            </h1>
          </div>
        </div>

        {/* Personal info */}
        <div className="md:px-8 px-4 ">
          {/* Section heading */}
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h1 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
              General info
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              This is how others will see you on the site.
            </p>
          </div>

          {/* Name table */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Name */}
            <NameForm name={user.name} />

            {/* Logo */}
            <LogoForm logo={undefined} />

            {/* Website */}
            <WebsiteForm website={undefined} />
          </div>
        </div>

        <div className="md:px-8 px-4 ">
          {/* Section heading */}
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h1 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
              Conversation starters
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Inspire your visitors to start a conversation with your
              documentation.
            </p>
          </div>

          {/* Conversation starters */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <div className="flex md:flex-1 justify-between py-6">
              <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
                Chat name
              </p>

              <Button
                className="text-sm dark:text-red-600"
                variant="link-color"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex md:flex-1 py-6">
              <Button className="text-sm" variant="link-color">
                Add new
              </Button>
            </div>
          </div>
        </div>
      </div>
    </GenerateLayout>
  );
}
