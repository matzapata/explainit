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
import { useAccessToken } from '@/lib/auth/use-session';
import { chatService } from '@/lib/services/chat-service';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
});

export default function NameForm(props: { chatId: string, name?: string }) {
  const accessTokenRaw = useAccessToken();
  const [open, setOpen] = useState<boolean>(false);
  const [name, setName] = useState<string | undefined>(props.name);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const setNameMutation = useMutation({
    mutationFn: (mutationProps: { name: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, mutationProps);
    },
    onSuccess: (data) => {
      setName(data.name);
      toast({ description: 'Name updated successfully.' });
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
        Chat name
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
              <DialogTitle>Update Name</DialogTitle>
              <DialogDescription>
                Make changes to your display name here. Click save when you're
                done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
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
