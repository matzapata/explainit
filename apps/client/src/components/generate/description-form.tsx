'use client';

import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '../ui/use-toast';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { chatService } from '@/lib/services/chat-service';

const formSchema = z.object({
  description: z.string().min(15, {
    message: 'Description must be at least 15 characters',
  }).max(100, {
    message: 'Description must be at most 100 characters',
  }),
});

export default function DescriptionForm(props: { chatId: string, description?: string }) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [open, setOpen] = useState<boolean>(false);
  const [name, setName] = useState<string | undefined>(props.description);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const setNameMutation = useMutation({
    mutationFn: (mutationProps: { description: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, mutationProps);
    },
    onSuccess: (data) => {
      setName(data.name);
      toast({ description: 'Description updated successfully.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setNameMutation.mutate(values);
  }

  return (
    <div className="space-y-2 md:space-y-0 md:flex py-6 items-center">
      <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
        Description
      </p>
      <div className="flex md:flex-1 justify-between items-center">
        <p className="text-sm text-gray-900 dark:text-gray-300">
          {name ?? '-'}
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="text-sm text-primary" variant="link">
              Update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Description</DialogTitle>
              <DialogDescription>
                What does your product do? Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Description" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" isLoading={setNameMutation.isPending}>
                    Save changes
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
