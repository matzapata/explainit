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
import { ChatResource, chatService } from '@/lib/services/chat-service';
import { toast } from '../ui/use-toast';


const formSchema = z.object({
  resource: z.string().url({ message: 'Invalid URL' }),
});

export default function ResourcesTable(props: {
  initialResources: ChatResource[];
}) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [resources, setResources] = useState<ChatResource[]>(
    props.initialResources,
  );
  const [open, setOpen] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resource: '',
    },
  });

  const addResourcesMutation = useMutation({
    mutationFn: (props: { resource: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.addResource(accessTokenRaw, props.resource)
    },
    onSuccess: (data) => {
      setResources((r) => [...r, data]);
      toast({ description: 'Successfully added resource.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (props: { id: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.deleteResource(accessTokenRaw, props.id)
    },
    onSuccess: (id) => {
      setResources((r) => r.filter((s) => s.id !== id));
      toast({ description: 'Successfully removed.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addResourcesMutation.mutate(values);
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
        {resources.map((s, i) => (
          <div key={i} className="flex md:flex-1 justify-between py-6">
            <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
              {s.data}
            </p>

            <Button
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to delete this conversation starter?',
                  )
                ) {
                  deleteResourceMutation.mutate({ id: s.id });
                }
              }}
              className="text-sm dark:text-red-600"
              variant="link-color"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </ul>

      {/* Add new form */}
      <div className="flex md:flex-1 py-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="text-sm" variant="link-color">
              Add new
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add a new resources</DialogTitle>
              <DialogDescription>
                Add more knowledge sources to your chatbot. The more you give the better responses you can get. Attach links to documentations, websites, and more.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="resource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversation starter</FormLabel>
                      <FormControl>
                        <Input placeholder="https://docs.lorem..." {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    isLoading={addResourcesMutation.isPending}
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
