'use client';

import { ChatMetadataDto, chatService } from '@/lib/services/chat-service';
import { Button } from '../ui/button';
import { ChatCard } from '../explore/chat-card';
import { useRouter } from 'next/navigation';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { paymentsService } from '@/lib/services/payments-service';
import { toast } from '../ui/use-toast';
import { useState } from 'react';
import { UserDto } from '@/lib/services/user-service';
import { confettiAnimation } from '@/lib/confetti-animation';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';

export function ShareStep(props: { chat: ChatMetadataDto; isPro: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { accessTokenRaw } = useKindeBrowserClient();
  const [published, setPublished] = useState<boolean>(true); // props.chat.published
  const {isCopied, copyToClipboard} = useCopyToClipboard({ timeout: 2000 });

  const onPublish = () => {
    if (!accessTokenRaw) {
      alert('You need to be logged in to subscribe to a plan.');
      return window.location.assign('/api/auth/login');
    }

    if (props.isPro) {
      setIsLoading(true);
      chatService
        .updateOwnerChat(accessTokenRaw, { published: true })
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
    } else {
      setIsLoading(true);
      paymentsService
        .createCheckout(accessTokenRaw)
        .then((url) => window.location.assign(url))
        .catch(() => {
          toast({
            variant: 'destructive',
            description: 'Something went wrong. Please try again.',
          });
        })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-center text-white text-lg font-medium">
          {published ? "You're done!" : 'Almost there!'}
        </h1>
        <p className="text-center text-gray-300">
          Share your documentation with the world!
        </p>
      </div>

      <div className="border-y border-y-gray-800 divide-gray-800">
        <ChatCard chat={props.chat} />
      </div>

      {published ? (
        <div className="flex justify-between my-4">
          <Button variant={'outline'} onClick={() => router.back()}>
            Back
          </Button>

          <div className="flex space-x-3 justify-center">

            {/* Share on twitter */}
            <button onClick={() => {
              window.open(`https://twitter.com/intent/tweet?text=Check out this chatbot!&url=${window.location.origin}/chat/${props.chat.id}`, '_blank')
            }} className="rounded-full h-10 w-10 border fill-gray-400 border-gray-600 flex justify-center items-center hover:bg-accent hover:fill-accent-foreground">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0 0 20 3.92a8.19 8.19 0 0 1-2.357.646 4.118 4.118 0 0 0 1.804-2.27 8.224 8.224 0 0 1-2.605.996 4.107 4.107 0 0 0-6.993 3.743 11.65 11.65 0 0 1-8.457-4.287 4.106 4.106 0 0 0 1.27 5.477A4.073 4.073 0 0 1 .8 7.713v.052a4.105 4.105 0 0 0 3.292 4.022 4.095 4.095 0 0 1-1.853.07 4.108 4.108 0 0 0 3.834 2.85A8.233 8.233 0 0 1 0 16.407a11.615 11.615 0 0 0 6.29 1.84"></path>
              </svg>
            </button>

            {/* Copy link */}
            <button disabled={!!isCopied} onClick={() => {
              copyToClipboard(`${window.location.origin}/chat/${props.chat.id}`);
              toast({ description: 'Link copied to clipboard' });
            }} className="rounded-full h-10 w-10 border text-gray-400 border-gray-600 flex justify-center items-center hover:bg-accent hover:text-accent-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                className="h-5 w-5 "
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
            </button>
          </div>

          <Button variant={"outline"} onClick={() => router.push('/generate')}>Edit</Button>
        </div>
      ) : (
        <div className="flex justify-between w-full items-center mt-6">
          <Button variant={'outline'} onClick={() => router.back()}>
            Back
          </Button>
          <div className="space-x-4 flex">
            <Button
              variant={'outline'}
              onClick={() => router.push(`/chat/${props.chat.id}`)}
            >
              Preview
            </Button>
            <Button isLoading={isLoading} onClick={onPublish}>
              Publish
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
