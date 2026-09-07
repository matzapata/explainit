'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { Button } from '../ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useAccessToken } from '@/lib/auth/use-session';
import { chatService } from '@/lib/services/chat-service';
import { toast } from '../ui/use-toast';

const formSchema = z.object({
  starter: z
    .string()
    .min(15, {
      message: 'conversation starter must be at least 15 characters',
    })
    .max(100, {
      message: 'conversation starter must be at most 100 characters',
    }),
});

export default function ConversationStartersTable(props: {
  chatId: string;
  starters: string[];
}) {
  const accessTokenRaw = useAccessToken();
  const [starters, setStarters] = useState<string[]>(props.starters);
  const [open, setOpen] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      starter: '',
    },
  });

  const addConversationStarterMutation = useMutation({
    mutationFn: (mutationProps: { starter: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, {
        conversationStarters: [...starters, mutationProps.starter],
      });
    },
    onSuccess: (data) => {
      setStarters(data.conversationStarters);
      toast({ description: 'Conversation starters updated successfully.' });
      setOpen(false);
    },
    onError: () => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  const deleteConversationStarterMutation = useMutation({
    mutationFn: (mutationProps: { starter: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, {
        conversationStarters: starters.filter((s) => s !== mutationProps.starter),
      });
    },
    onSuccess: (data) => {
      setStarters(data.conversationStarters);
      toast({ description: 'Successfully removed.' });
      setOpen(false);
    },
    onError: () => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addConversationStarterMutation.mutate(values);
  }

  return (
    <div>
      <ul className="divide-y divide-gray-100 dark:divide-white/5">
        {starters.map((s, i) => (
          <li
            key={i}
            className="flex justify-between items-center py-2.5 text-sm"
          >
            <span>{s}</span>
            <Button
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to delete this conversation starter?',
                  )
                ) {
                  deleteConversationStarterMutation.mutate({ starter: s });
                }
              }}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="sr-only">Remove starter</span>
            </Button>
          </li>
        ))}
      </ul>

      <div className="pt-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Add starter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add a conversation starter</DialogTitle>
              <DialogDescription>
                Help visitors quickly understand what kind of questions they can
                ask.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="starter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversation starter</FormLabel>
                      <FormControl>
                        <Input placeholder="How to..." {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    isLoading={addConversationStarterMutation.isPending}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
