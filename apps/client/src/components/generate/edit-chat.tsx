'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import GenerateLayout from '@/layouts/generate-layout';
import ChatDetailsForm from './chat-details-form';
import ConversationStartersTable from './conversation-starters-table';
import HostOriginsTable from './host-origins-table';
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
import { buttonVariants } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAccessToken } from '@/lib/auth/use-session';
import { useRouter } from '@/lib/router';
import { chatService } from '@/lib/services/chat-service';

export function EditChat({ user, chat }: { user: any; chat: any }) {
  const [hostOrigins, setHostOrigins] = useState<string[]>(
    chat.hostOrigins ?? [],
  );

  return (
    <GenerateLayout user={{ email: user.email }} chat={chat}>
      <div className="space-y-8">
        <ChatDetailsForm
          chatId={chat.id}
          name={chat.name}
          description={chat.description}
        />

        <HostOriginsTable
          chatId={chat.id}
          hostOrigins={hostOrigins}
          onHostOriginsChange={setHostOrigins}
        />

        <div className="max-w-md">
          <p className="text-sm font-medium mb-1">Conversation starters</p>
          <ConversationStartersTable
            chatId={chat.id}
            starters={chat.conversationStarters}
          />
        </div>

        <DeleteChatButton chatId={chat.id} />
      </div>
    </GenerateLayout>
  );
}

function DeleteChatButton({ chatId }: { chatId: string }) {
  const accessToken = useAccessToken();
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) throw new Error('No access token');
      return chatService.deleteChat(accessToken, chatId);
    },
    onSuccess: async () => {
      queryClient.setQueryData(
        ['chats'],
        (current: { id: string }[] | undefined) =>
          current?.filter((row) => row.id !== chatId) ?? current,
      );
      await queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast({ description: 'Chat deleted.' });
      router.push('/');
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: 'Could not delete chat. Please try again.',
      });
    },
  });

  return (
    <div className="max-w-md pt-4 border-t border-gray-200 dark:border-white/10">
      <AlertDialog>
        <AlertDialogTrigger
          className={cn(buttonVariants({ variant: 'destructive' }), 'px-0')}
          disabled={deleteMutation.isPending}
        >
          Delete Chat
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the chat and its resources. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-red-600 hover:underline dark:text-red-400"
              onClick={() => deleteMutation.mutate()}
            >
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
