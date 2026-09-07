'use client';

import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useMutation } from '@tanstack/react-query';
import { toast } from '../ui/use-toast';
import { useAccessToken } from '@/lib/auth/use-session';
import { chatService } from '@/lib/services/chat-service';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  description: z
    .string()
    .min(15, {
      message: 'Description must be at least 15 characters',
    })
    .max(100, {
      message: 'Description must be at most 100 characters',
    }),
});

export default function ChatDetailsForm(props: {
  chatId: string;
  name?: string;
  description?: string;
}) {
  const accessTokenRaw = useAccessToken();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: props.name ?? '',
      description: props.description ?? '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, values);
    },
    onSuccess: () => {
      toast({ description: 'Saved.' });
    },
    onError: () => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
        className="max-w-md"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel className="block text-sm font-medium mb-1 dark:text-gray-100">
                Chat name
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel className="block text-sm font-medium mb-1 dark:text-gray-100">
                Description
              </FormLabel>
              <FormControl>
                <Textarea className="min-h-[88px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" isLoading={saveMutation.isPending}>
          Save
        </Button>
      </form>
    </Form>
  );
}
