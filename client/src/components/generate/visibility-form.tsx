'use client';

import { Button, buttonVariants } from '../ui/button';
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

export default function VisibilityForm(props: {
  published: boolean;
  id: string;
}) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [published, setPublished] = useState<boolean>(props.published);

  const setVisibilityMutation = useMutation({
    mutationFn: (props: { published: boolean }) => {
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
    },
    onError: (error) => {
      toast({ variant: "destructive", description: error.message ?? `Sorry, something went wrong. Please try again.` });
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
          <AlertDialogTrigger className={cn(buttonVariants({ variant: "link-color" }), "text-sm")}   disabled={setVisibilityMutation.isPending}>
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
