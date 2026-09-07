'use client';

import { useState } from 'react';
import GenerateLayout from '@/layouts/generate-layout';
import NameForm from './name-form';
import DescriptionForm from './description-form';
import ConversationStartersTable from './conversation-starters-table';
import HostOriginsTable from './host-origins-table';
import VisibilityForm from './visibility-form';
import CodeSnippet from './code-snippet';

export function EditChat({ user, chat }: { user: any; chat: any }) {
  const [hostOrigins, setHostOrigins] = useState<string[]>(
    chat.hostOrigins ?? [],
  );

  return (
    <GenerateLayout
      user={{ email: user.email }}
      chat={chat}
    >
      <div className="py-8 md:py-12 space-y-8 max-w-6xl mx-auto">
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
              Name, description, and Host origins allowlisted for the visitor
              API. Add every origin where this Chat is installed (www and apex
              are different).
            </p>
          </div>

          {/* Name table */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Name */}
            <NameForm chatId={chat.id} name={chat.name} />

            {/* Description */}
            <DescriptionForm chatId={chat.id} description={chat.description} />

            <HostOriginsTable
              chatId={chat.id}
              hostOrigins={hostOrigins}
              onHostOriginsChange={setHostOrigins}
            />
          </div>
        </div>

        {/* Conversation starters */}
        <div className="md:px-8 px-4 ">
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
          <ConversationStartersTable chatId={chat.id} starters={chat.conversationStarters} />
        </div>

        {/* Install */}
        <div className="md:px-8 px-4 ">
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h1 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
              Install on your website
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Publish your Chat, add Host origins, then paste the same Install
              snippet on each allowlisted origin. Origins are the API whitelist;
              the snippet does not declare them.
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <VisibilityForm id={chat.id} published={chat.published} />

            <CodeSnippet id={chat.id} hostOrigins={hostOrigins} />
          </div>
        </div>
      </div>
    </GenerateLayout>
  );
}
