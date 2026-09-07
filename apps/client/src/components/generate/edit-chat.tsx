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
    <GenerateLayout user={{ email: user.email }} chat={chat}>
      <div className="space-y-8">
        <div>
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              General info
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Name, description, and Host origins allowlisted for the visitor
              API. Add every origin where this Chat is installed (www and apex
              are different).
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <NameForm chatId={chat.id} name={chat.name} />
            <DescriptionForm chatId={chat.id} description={chat.description} />
            <HostOriginsTable
              chatId={chat.id}
              hostOrigins={hostOrigins}
              onHostOriginsChange={setHostOrigins}
            />
          </div>
        </div>

        <div>
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              Conversation starters
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Inspire your visitors to start a conversation with your
              documentation.
            </p>
          </div>

          <ConversationStartersTable
            chatId={chat.id}
            starters={chat.conversationStarters}
          />
        </div>

        <div>
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              Install on your website
            </h2>
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
