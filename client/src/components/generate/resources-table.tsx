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
import { Textarea } from '../ui/textarea';

const inspectFormSchema = z.object({
  url: z.string().url({ message: 'Invalid URL' }),
});
const addFormSchema = z.object({
  urls: z
    .string()
    .min(10, { message: 'Please provide at least one URL to add' }),
});

function stringIsAValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
}

export default function ResourcesTable(props: {
  initialResources: ChatResource[];
}) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [resources, setResources] = useState<ChatResource[]>(
    props.initialResources,
  );
  const [open, setOpen] = useState<boolean>(false);
  const [urls, setUrls] = useState<string[]>([]);
  const inspectForm = useForm<z.infer<typeof inspectFormSchema>>({
    resolver: zodResolver(inspectFormSchema),
    defaultValues: {
      url: '',
    },
  });
  const addForm = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      urls: '',
    },
  });

  const inspectResourceMutation = useMutation({
    mutationFn: async (props: { url: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.inspectResource(accessTokenRaw, props.url);
    },
    onSuccess: (data) => {
      setUrls(data.urls);
      addForm.setValue('urls', data.urls.join('\n'));
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  const addResourcesMutation = useMutation({
    mutationFn: (props: { urls: string[] }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.addResource(accessTokenRaw, props.urls);
    },
    onSuccess: (data) => {
      setResources((r) => [...r, ...data]);
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
      return chatService.deleteResource(accessTokenRaw, props.id);
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

  function onAddSubmit(values: z.infer<typeof addFormSchema>) {
    const urls = values.urls.split('\n').filter((u) => !!u);
    for (const u of urls) {
      if (!stringIsAValidUrl(u)) {
        addForm.setError('urls', {
          type: 'manual',
          message: `Invalid URL ${u}`,
        });
        return;
      }
    }

    addResourcesMutation.mutate({ urls: urls });
  }

  function onInspectSubmit(values: z.infer<typeof inspectFormSchema>) {
    inspectResourceMutation.mutate(values);
  }

  function onDeleteClick(id: string) {
    if (
      window.confirm(
        "Are you sure you want to delete this resource? The ai won't know about that topic anymore.",
      )
    ) {
      deleteResourceMutation.mutate({ id });
    }
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
              onClick={() => onDeleteClick(s.id)}
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
        <Dialog
          open={open}
          onOpenChange={(o) => {
            if (!o) {
              inspectForm.reset();
              addForm.reset();
              setUrls([]);
            }
            setOpen(o);
          }}
        >
          <DialogTrigger asChild>
            <Button className="text-sm" variant="link-color">
              Add new
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Add a new resources</DialogTitle>
              <DialogDescription>
                Add more knowledge sources to your chatbot. The more you give
                the better responses you can get. Give us a starter url, we'll
                see what we can find and start from there.
              </DialogDescription>
            </DialogHeader>

            {/* Inspect form */}
            <Form {...inspectForm}>
              <form
                onSubmit={inspectForm.handleSubmit(onInspectSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={inspectForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your documentation base url</FormLabel>
                      <FormControl>
                        <Input placeholder="https://docs.lorem..." {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!urls.length && (
                  <DialogFooter>
                    <Button
                      type="submit"
                      isLoading={inspectResourceMutation.isPending}
                    >
                      Add
                    </Button>
                  </DialogFooter>
                )}
              </form>
            </Form>

            {/* Add form */}
            {!urls.length ? null : (
              <Form {...addForm}>
                <form
                  onSubmit={addForm.handleSubmit(onAddSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={addForm.control}
                    name="urls"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-gray-300 mb-2 text-sm">
                          We found the following urls, do you want to add them
                          all? Are we missing anything? Do one url per line
                        </p>
                        <FormControl>
                          <Textarea
                            rows={10}
                            placeholder="Type your message here."
                            {...field}
                          />
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
                      Add all
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
