'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import Navbar from '@/components/navbar/app';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { useAccessToken } from '@/lib/auth/use-session';
import { Link, useRouter } from '@/lib/router';
import { ChatMetadataDto, chatService } from '@/lib/services/chat-service';
import { UserDto } from '@/lib/services/user-service';

const createChatSchema = z.object({
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

export function ChatsList({ user, chats }: { user: UserDto; chats: ChatMetadataDto[] }) {
  const router = useRouter();
  const accessToken = useAccessToken();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(chats);
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof createChatSchema>>({
    resolver: zodResolver(createChatSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof createChatSchema>) => {
      if (!accessToken) throw new Error('No access token');
      return chatService.createChat(accessToken, values);
    },
    onSuccess: async (chat) => {
      setOpen(false);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ['chats'] });
      router.push(`/chats/${chat.id}`);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: 'Could not create chat. Please try again.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!accessToken) throw new Error('No access token');
      return chatService.deleteChat(accessToken, id);
    },
    onSuccess: (_chat, id) => {
      setRows((current) => current.filter((chat) => chat.id !== id));
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast({ description: 'Chat deleted.' });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: 'Could not delete chat. Please try again.',
      });
    },
  });

  return (
    <>
      <Navbar user={{ email: user.email }} />
      <main>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chats
            </h1>
            {user.isAdmin && (
              <Dialog
                open={open}
                onOpenChange={(next) => {
                  setOpen(next);
                  if (!next) {
                    form.reset();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Add Chat
                  </Button>
                </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Chat</DialogTitle>
                      <DialogDescription>
                        Give the new chat a name and short description.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit((values) =>
                          createMutation.mutate(values),
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Docs assistant" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Answers questions about our product docs."
                                  className="text-sm"
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
                            isLoading={createMutation.isPending}
                          >
                            Create
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
          </div>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground"
                    >
                      No chats yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((chat) => (
                    <TableRow key={chat.id}>
                      <TableCell>
                        <Link
                          href={`/chats/${chat.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {chat.name?.trim() || 'Untitled chat'}
                        </Link>
                      </TableCell>
                      <TableCell
                        className={
                          chat.published
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {chat.published ? 'Published' : 'Draft'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatChatDate(chat.lastUsedAt, 'Never')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatChatDate(chat.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <ChatRowMenu
                          chat={chat}
                          deleting={deleteMutation.isPending}
                          onDelete={() => {
                            if (
                              window.confirm(
                                'Delete this chat and its resources? This cannot be undone.',
                              )
                            ) {
                              deleteMutation.mutate(chat.id);
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </>
  );
}

function ChatRowMenu({
  chat,
  deleting,
  onDelete,
}: {
  chat: ChatMetadataDto;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <EllipsisHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open chat actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            void copyText(chat.id).then((copied) => {
              toast({
                variant: copied ? 'default' : 'destructive',
                description: copied
                  ? 'Chat ID copied.'
                  : 'Could not copy chat ID.',
              });
            });
          }}
        >
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500"
          disabled={deleting}
          onSelect={onDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatChatDate(value?: string | Date | null, empty = '—') {
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
    year: 'numeric',
  });
}

async function copyText(value: string) {
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.focus();
  input.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(input);
  if (copied) {
    return true;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
