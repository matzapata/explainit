'use client';

import { buttonVariants } from '../ui/button';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '../ui/use-toast';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { chatService } from '@/lib/services/chat-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

import confetti from 'canvas-confetti';

export default function VisibilityForm(props: {
  published: boolean;
  id: string;
}) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [published, setPublished] = useState<boolean>(props.published);

  const setVisibilityMutation = useMutation({
    mutationFn: async (props: { published: boolean }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, {
        published: props.published,
      });
    },
    onSuccess: (data) => {
      setPublished(data.published);
      toast({
        description: data.published
          ? 'Congratulations your chat is now accessible by the world!'
          : "Hey! Don't wait too long before making it public again!",
      });

      if (data.published) {
        // firework animation
        const duration = 10 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 0,
        };

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min;
        };

        const interval: NodeJS.Timeout = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          // since particles fall down, start a bit higher than random
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description:
          error.message ?? `Sorry, something went wrong. Please try again.`,
      });
    },
  });

  return (
    <div className="space-y-2 md:space-y-0 md:flex py-6">
      <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
        Visibility
      </p>
      <div className="flex md:flex-1 justify-between">
        <p className="text-sm text-gray-900 dark:text-gray-300">
          {published ? 'Visible' : 'Hidden'}
        </p>

        <AlertDialog>
          <AlertDialogTrigger
            className={cn(buttonVariants({ variant: 'link' }), 'text-s text-primary')}
            disabled={setVisibilityMutation.isPending}
          >
            {published ? 'Hide' : 'Publish'}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {published
                  ? 'This will hide your chat from the public.'
                  : 'This will make your chat public.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setVisibilityMutation.mutate({ published: !published });
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
