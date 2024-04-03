'use client';

import { Button } from '@/components/ui/button';
import { ChatResource } from '@/lib/services/chat-service';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import GoProBanner from '../billing/go-pro-banner';

export default function CreateChat(props: {
  initialResources: ChatResource[];
}) {
  const router = useRouter();
  const { accessTokenRaw } = useKindeBrowserClient();
  const [resources, setResources] = useState<ChatResource[]>(
    props.initialResources,
  );

  return (
    <main>
      <div className="pt-12 pb-24 max-w-6xl mx-auto">
        <GoProBanner />

        {/* Heading */}
        <div className="px-4 md:px-8 space-y-8 mt-8">
          <h1 className="font-semibold text-2xl md:3xl text-gray-900 dark:text-white">
            Resources
          </h1>

          <div className=" space-y-1 pb-5 border-b dark:border-b-gray-700">
            <h2 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
              Add data sources to your chat
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Your chatbot will respond only with the information you provide,
              the better the information the better the response we can
              generate. You can load public github repositories, websites,
              documentation sites, and more.
            </p>
          </div>
        </div>

        {/* loaded table */}
        <div className="px-4 md:px-8 divide-y divide-gray-200 dark:divide-gray-800">
          <div className="flex md:flex-1 justify-between py-6 space-x-2">
            <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300 break-all flex-1">
              https://js.langchain.com/docs/integrations/document_loaders/web_loaders/recursive_url_loader
            </p>

            <Button className="text-sm dark:text-red-600" variant="link-color">
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
    </main>
  );
}
