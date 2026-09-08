'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
import { ChatResource, chatService } from '@/lib/services/chat-service';
import { toast } from '../ui/use-toast';
import { Textarea } from '../ui/textarea';

const addTextFormSchema = z.object({
  text: z
    .string()
    .min(1000, { message: 'Please provide at least 1000 characters' }),
  title: z.string().min(5, { message: 'Please provide a title' }),
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
        className="text-blue-600 hover:underline dark:text-blue-400"
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
    (resource) => resource.status === 'pending' || resource.status === 'processing',
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
      return chatService.deleteResource(accessTokenRaw,props.chatId,  mutationProps.id);
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <AddNewWebResource chatId={props.chatId} setResources={setResources} initialUrl={props.initialUrl} />
        <AddTextResource chatId={props.chatId} setResources={setResources} />
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-8">
          No resources yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-8 pr-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <ResourceSourceLabel resource={s} />
                </TableCell>
                <TableCell>
                  <ResourceStatusLabel resource={s} />
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {formatResourceDate(s.updatedAt)}
                </TableCell>
                <TableCell className="pr-0 text-right">
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

function AddNewWebResource(props: { setResources: (r: any) => void, initialUrl?: string, chatId: string }) {
  const accessTokenRaw = useAccessToken();
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
    mutationFn: async (mutationProps: { url: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.inspectResource(accessTokenRaw, props.chatId, mutationProps.url);
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
    mutationFn: (mutationProps: { urls: string[] }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.addWebResource(accessTokenRaw, props.chatId, mutationProps.urls);
    },
    onSuccess: (data) => {
      props.setResources((r: any) => [...r, ...data]);
      toast({ description: 'Queued for indexing.' });
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
        <Button variant="outline" size="sm">
          Add website
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

function AddTextResource(props: { setResources: (r: any) => void, chatId: string }) {
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
    mutationFn: async (mutationProps: {
      text: string;
      title: string;
    }) => {
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
                    <Textarea
                      rows={10}
                      placeholder="Content....."
                      {...field}
                    />
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
