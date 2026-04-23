import GenerateLayout from '@/layouts/generate-layout';
import GoProBanner from '../billing/go-pro-banner';
import NameForm from './name-form';
import LogoForm from './logo-form';
import WebsiteForm from './website-form';
import DescriptionForm from './description-form';
import ConversationStartersTable from './conversation-starters-table';
import VisibilityForm from './visibility-form';
import ShareLinkForm from './share-link';
import CodeSnippet from './code-snippet';

export function EditChat({ user, chat }: { user: any; chat: any }) {
  return (
    <GenerateLayout
      user={{ email: user.email, isPro: user.isPro }}
      chatId={chat.id}
    >
      <div className="py-8 md:py-12 space-y-8 max-w-6xl mx-auto">
        {!user.isPro && <GoProBanner />}

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
            <NameForm chatId={chat.id} name={chat.name} />

            {/* Logo */}
            <LogoForm chatId={chat.id} logo={chat.logo} />

            {/* Description */}
            <DescriptionForm chatId={chat.id} description={chat.description} />

            {/* Website */}
            <WebsiteForm chatId={chat.id} website={chat.url} />
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

        {/* Share chat */}
        <div className="md:px-8 px-4 ">
          <div className="space-y-1 border-b dark:border-b-gray-800 pb-6">
            <h1 className="text-lg md:text-base text-gray-900 dark:text-white font-semibold">
              Share your chat with your users!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Share your documentation with the world! You can use the link
              below to share it with your users.
            </p>
          </div>

          {/* Share */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <VisibilityForm id={chat.id} published={chat.published} />

            <ShareLinkForm id={chat.id} />

            <CodeSnippet id={chat.id} />
          </div>
        </div>
      </div>
    </GenerateLayout>
  );
}
