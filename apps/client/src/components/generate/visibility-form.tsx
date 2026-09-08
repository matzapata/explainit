'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
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
import { useAccessToken } from '@/lib/auth/use-session';
import { confettiAnimation } from '@/lib/confetti-animation';
import { chatService } from '@/lib/services/chat-service';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { toast } from '../ui/use-toast';

export default function VisibilityForm(props: {
  published: boolean;
  id: string;
}) {
  const accessTokenRaw = useAccessToken();
  const [published, setPublished] = useState<boolean>(props.published);

  const setVisibilityMutation = useMutation({
    mutationFn: async (mutationProps: { published: boolean }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.id, {
        published: mutationProps.published,
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
        confettiAnimation();
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
    <div className="max-w-md">
      <p className="text-sm font-medium mb-1">Visibility</p>
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {published ? 'Published' : 'Draft'}
        </p>
        <AlertDialog>
          <AlertDialogTrigger
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            disabled={setVisibilityMutation.isPending}
          >
            {published ? 'Unpublish' : 'Publish'}
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
