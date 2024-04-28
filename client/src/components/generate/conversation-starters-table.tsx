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
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
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
  starters: string[];
}) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [starters, setStarters] = useState<string[]>(props.starters);
  const [open, setOpen] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      starter: '',
    },
  });

  const addConversationStarterMutation = useMutation({
    mutationFn: (props: { starter: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, {
        conversationStarters: [...starters, props.starter],
      });
    },
    onSuccess: (data) => {
      setStarters(data.conversationStarters);
      toast({ description: 'Conversation starters updated successfully.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  const deleteConversationStarterMutation = useMutation({
    mutationFn: (props: { starter: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, {
        conversationStarters: starters.filter((s) => s !== props.starter),
      });
    },
    onSuccess: (data) => {
      setStarters(data.conversationStarters);
      toast({ description: 'Successfully removed.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addConversationStarterMutation.mutate(values);
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
        {starters.map((s, i) => (
          <div key={i} className="flex md:flex-1 justify-between py-6">
            <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
              {s}
            </p>

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
              className="text-sm dark:text-red-600"
              variant="link"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </ul>

      {/* Add new form */}
      <div className="flex md:flex-1 py-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="text-sm px-0 text-primary" variant="link">
              Add new
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add a new conversation starter</DialogTitle>
              <DialogDescription>
                Help your customers quickly understand what kind of questions
                they can make
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
