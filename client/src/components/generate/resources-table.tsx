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

const addTextFormSchema = z.object({
  text: z
    .string()
    .min(1000, { message: 'Please provide at least 1000 characters' }),
  title: z.string().min(5, { message: 'Please provide a title' }),
  source: z.string().min(5, { message: 'Please provide a source' }),
});
const inspectFormSchema = z.object({
  url: z.string().url({ message: 'Invalid URL' }),
});
const addWebFormSchema = z.object({
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

  const deleteResourceMutation = useMutation({
    mutationFn: (props: { id: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.deleteResource(accessTokenRaw, props.id);
    },
    onSuccess: (id) => {
      setResources((r) => r.filter((s) => s.id !== id));
      toast({ description: 'Successfully removed.' });
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

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
              variant="link"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </ul>

      {/* Add new form */}
      <div className="flex md:flex-1 py-6 space-x-6">
        <AddNewWebResource setResources={setResources} />

        <AddTextResource setResources={setResources} />
      </div>
    </div>
  );
}

function AddNewWebResource(props: { setResources: (r: any) => void }) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [open, setOpen] = useState<boolean>(false);
  const [urls, setUrls] = useState<string[]>([]);
  const inspectForm = useForm<z.infer<typeof inspectFormSchema>>({
    resolver: zodResolver(inspectFormSchema),
    defaultValues: {
      url: '',
    },
  });
  const addForm = useForm<z.infer<typeof addWebFormSchema>>({
    resolver: zodResolver(addWebFormSchema),
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
      return chatService.addWebResource(accessTokenRaw, props.urls);
    },
    onSuccess: (data) => {
      props.setResources((r: any) => [...r, ...data]);
      toast({ description: 'Successfully added resource.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: `Sorry, something went wrong. Please try again. ${error?.message}`,
      });
    },
  });

  function onAddSubmit(values: z.infer<typeof addWebFormSchema>) {
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

  return (
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
        <Button className="text-sm text-primary" variant="link">
          Add with crawling
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add a new web resources</DialogTitle>
          <DialogDescription>
            Add more knowledge sources to your chatbot. The more you give the
            better responses you can get. Give us a starter url, we'll see what
            we can find and start from there.
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
                      Please cleanup the urls you don't want to add. Try to keep
                      only content users may want to know for better
                      performance. Also new urls if any is missing.
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
  );
}

function AddTextResource(props: { setResources: (r: any) => void }) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [open, setOpen] = useState<boolean>(false);
  const inspectForm = useForm<z.infer<typeof addTextFormSchema>>({
    resolver: zodResolver(addTextFormSchema),
    defaultValues: {
      text: '',
      source: '',
      title: '',
    },
  });

  const addTextMutation = useMutation({
    mutationFn: async (props: {
      text: string;
      source: string;
      title: string;
    }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.addTextResource(accessTokenRaw, props.text, props.title, props.source);
    },
    onSuccess: (data) => {
      console.log("data", data)
      props.setResources((r: any) => [...r, ...data]);
      toast({ description: 'Successfully added resource.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: `Sorry, something went wrong. Please try again. ${error?.message}`,
      });
    },
  });

  function onAddTextSubmit(values: z.infer<typeof addTextFormSchema>) {
    addTextMutation.mutate(values);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          inspectForm.reset();
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button className="text-sm text-primary" variant="link">
          Add text
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add a new text resources</DialogTitle>
          <DialogDescription>
            Add more knowledge sources to your chatbot. The more you give the
            better responses you can get. Manually paste your text here.
          </DialogDescription>
        </DialogHeader>

        {/* Inspect form */}
        <Form {...inspectForm}>
          <form
            onSubmit={inspectForm.handleSubmit(onAddTextSubmit)}
            className="space-y-4"
          >
            <FormField
              control={inspectForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="How to create a wallet with solana"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={inspectForm.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="https://lorem..." {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={inspectForm.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl>
                    <FormControl>
                      <Textarea
                        rows={10}
                        placeholder="Content....."
                        {...field}
                      />
                    </FormControl>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" isLoading={addTextMutation.isPending}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
