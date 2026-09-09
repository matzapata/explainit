'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAccessToken } from '@/lib/auth/use-session';
import { type ChatResource, chatService } from '@/lib/services/chat-service';
import { Button } from '../ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Textarea } from '../ui/textarea';
import { toast } from '../ui/use-toast';

const addTextFormSchema = z.object({
  text: z
    .string()
    .min(1000, { message: 'Please provide at least 1000 characters' }),
  title: z.string().min(5, { message: 'Please provide a title' }),
});
const addWebFormSchema = z.object({
  url: z.string().url({ message: 'Invalid URL' }),
});

function stringIsAValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function formatResourceDate(value?: string | Date | null, empty = '—') {
  if (!value) {
    return empty;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return empty;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function ResourceSourceLabel(props: { resource: ChatResource }) {
  const label = props.resource.title || props.resource.data;
  if (stringIsAValidUrl(props.resource.data)) {
    return (
      <a
        href={props.resource.data}
        target="_blank"
        rel="noreferrer"
        className="block truncate text-blue-600 hover:underline dark:text-blue-400"
      >
        {label}
      </a>
    );
  }
  return <>{label}</>;
}

export default function ResourcesTable(props: {
  chatId: string;
  initialUrl?: string;
  initialResources: ChatResource[];
}) {
  const accessTokenRaw = useAccessToken();
  const [resources, setResources] = useState<ChatResource[]>(
    props.initialResources,
  );

  const inflight = resources.some(
    (resource) =>
      resource.status === 'pending' || resource.status === 'processing',
  );

  useEffect(() => {
    if (!inflight || !accessTokenRaw) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const chat = await chatService.getOwnerChatById(
          accessTokenRaw,
          props.chatId,
        );
        setResources(chat.resources ?? []);
      } catch {
        // ignore transient poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [inflight, accessTokenRaw, props.chatId]);

  const deleteResourceMutation = useMutation({
    mutationFn: (mutationProps: { id: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.deleteResource(
        accessTokenRaw,
        props.chatId,
        mutationProps.id,
      );
    },
    onSuccess: (_data, variables) => {
      setResources((r) => r.filter((s) => s.id !== variables.id));
      toast({ description: 'Successfully removed.' });
    },
    onError: () => {
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <AddNewWebResource
          chatId={props.chatId}
          setResources={setResources}
          initialUrl={props.initialUrl}
        />
        <AddTextResource chatId={props.chatId} setResources={setResources} />
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-8">
          No resources yet.
        </p>
      ) : (
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-24">Updated</TableHead>
              <TableHead className="w-12 pr-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="min-w-0 truncate font-medium">
                  <ResourceSourceLabel resource={s} />
                </TableCell>
                <TableCell className="w-28 truncate">
                  <ResourceStatusLabel resource={s} />
                </TableCell>
                <TableCell className="w-24 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {formatResourceDate(s.updatedAt)}
                </TableCell>
                <TableCell className="w-12 pr-0 text-right">
                  <Button
                    onClick={() => onDeleteClick(s.id)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span className="sr-only">Remove resource</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ResourceStatusLabel(props: { resource: ChatResource }) {
  const status = props.resource.status ?? 'ready';
  if (status === 'ready') {
    return <span className="text-gray-500 dark:text-gray-400">Ready</span>;
  }
  if (status === 'pending') {
    return <span className="text-gray-500 dark:text-gray-400">Queued</span>;
  }
  if (status === 'processing') {
    return <span className="text-gray-500 dark:text-gray-400">Indexing…</span>;
  }
  return (
    <span
      className="text-red-600 dark:text-red-400"
      title={props.resource.error ?? undefined}
    >
      Failed{props.resource.error ? `: ${props.resource.error}` : ''}
    </span>
  );
}

function AddNewWebResource(props: {
  setResources: (r: any) => void;
  initialUrl?: string;
  chatId: string;
}) {
  const accessTokenRaw = useAccessToken();
  const [open, setOpen] = useState<boolean>(false);
  const form = useForm<z.infer<typeof addWebFormSchema>>({
    resolver: zodResolver(addWebFormSchema),
    defaultValues: {
      url: props.initialUrl ?? '',
    },
  });

  const addPageMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.addWebResource(accessTokenRaw, props.chatId, [url]);
    },
    onSuccess: (data) => {
      props.setResources((r: any) => [...r, ...data]);
      toast({ description: 'Queued for indexing.' });
      setOpen(false);
      form.reset({ url: '' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: `Sorry, something went wrong. Please try again. ${error?.message}`,
      });
    },
  });

  const crawlSiteMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.crawlWebResource(accessTokenRaw, props.chatId, url);
    },
    onSuccess: (data) => {
      props.setResources((r: any) => [...r, ...data]);
      toast({
        description:
          'Crawl queued. Linked pages will appear as they are found.',
      });
      setOpen(false);
      form.reset({ url: '' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: `Sorry, something went wrong. Please try again. ${error?.message}`,
      });
    },
  });

  const isLoading = addPageMutation.isPending || crawlSiteMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          form.reset({ url: props.initialUrl ?? '' });
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add website
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add a website</DialogTitle>
          <DialogDescription>
            Index just this page, or crawl linked pages from the same site under
            this URL (up to 50 pages, depth 4).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://docs.example.com/guide"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                isLoading={addPageMutation.isPending}
                disabled={isLoading}
                onClick={form.handleSubmit((values) =>
                  addPageMutation.mutate(values.url),
                )}
              >
                Add this page
              </Button>
              <Button
                type="button"
                isLoading={crawlSiteMutation.isPending}
                disabled={isLoading}
                onClick={form.handleSubmit((values) =>
                  crawlSiteMutation.mutate(values.url),
                )}
              >
                Crawl this site
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddTextResource(props: {
  setResources: (r: any) => void;
  chatId: string;
}) {
  const accessTokenRaw = useAccessToken();
  const [open, setOpen] = useState<boolean>(false);
  const inspectForm = useForm<z.infer<typeof addTextFormSchema>>({
    resolver: zodResolver(addTextFormSchema),
    defaultValues: {
      text: '',
      title: '',
    },
  });

  const addTextMutation = useMutation({
    mutationFn: async (mutationProps: { text: string; title: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.addTextResource(
        accessTokenRaw,
        props.chatId,
        mutationProps.text,
        mutationProps.title,
      );
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
        <Button variant="outline" size="sm">
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
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl>
                    <Textarea rows={10} placeholder="Content....." {...field} />
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
