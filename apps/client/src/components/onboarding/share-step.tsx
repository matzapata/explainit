'use client';

import { ChatMetadataDto, chatService } from '@/lib/services/chat-service';
import { Button } from '../ui/button';
import { ChatCard } from './chat-card';
import { PreviewChat } from '@/components/chat/preview-chat';
import { useRouter } from '@/lib/router';
import { useAccessToken } from '@/lib/auth/use-session';
import { loginHref } from '@/lib/auth/config';
import { toast } from '../ui/use-toast';
import { useState } from 'react';
import { confettiAnimation } from '@/lib/confetti-animation';
import CodeSnippet from '@/components/generate/code-snippet';

export function ShareStep(props: { chat: ChatMetadataDto }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const accessTokenRaw = useAccessToken();
  const [published, setPublished] = useState<boolean>(props.chat.published);

  const onPublish = () => {
    if (!accessTokenRaw) {
      alert('You need to be logged in to publish your chat.');
      return window.location.assign(loginHref());
    }

    setIsLoading(true);
    chatService
      .updateOwnerChat(accessTokenRaw, props.chat.id, { published: true })
      .then(() => {
        setPublished(true);
        toast({
          description:
            'Congratulations your chat is now accessible by the world!',
        });
        confettiAnimation();
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          description: 'Something went wrong. Please try again.',
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-center text-white text-lg font-medium">
          {published ? "You're done!" : 'Almost there!'}
        </h1>
        <p className="text-center text-gray-300">
          {published
            ? 'Install the Launcher on your website so Visitors can Ask AI.'
            : 'Publish your Chat, then install it on your website.'}
        </p>
      </div>

      <div className="border-y border-y-gray-800 divide-gray-800">
        <ChatCard chat={props.chat} />
      </div>

      {published ? (
        <>
          <div className="my-4 rounded-lg border border-gray-800 px-4">
            <CodeSnippet id={props.chat.id} website={props.chat.url} />
          </div>
          <div className="flex justify-between my-4">
            <Button variant={'outline'} onClick={() => router.back()}>
              Back
            </Button>
            <div className="flex space-x-3">
              <PreviewChat chat={props.chat} variant="outline" size="default" />
              <Button variant={'outline'} onClick={() => router.push('/')}>
                Edit
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-between w-full items-center mt-6">
          <Button variant={'outline'} onClick={() => router.back()}>
            Back
          </Button>
          <div className="space-x-4 flex">
            <PreviewChat chat={props.chat} variant="outline" size="default" />
            <Button isLoading={isLoading} onClick={onPublish}>
              Publish
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
