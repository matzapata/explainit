'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAccessToken } from '@/lib/auth/use-session';
import { Link, useRouter } from '@/lib/router';
import { type ChatMetadataDto, chatService } from '@/lib/services/chat-service';
import type { UserDto } from '@/lib/services/user-service';

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

export function ChatsList({
  user,
  chats,
}: {
  user: UserDto;
  chats: ChatMetadataDto[];
}) {
  const router = useRouter();
  const accessToken = useAccessToken();
  const queryClient = useQueryClient();
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

  return (
    <>
      <Navbar user={{ email: user.email }} />
      <main>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">Chats</h1>
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

          {chats.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No chats yet.
              </p>
              {user.isAdmin && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-sm text-gray-900 dark:text-gray-100 underline"
                    onClick={() => setOpen(true)}
                  >
                    Add Chat
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6 mt-6">
              <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Last used
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Last updated
                      </TableHead>
                      <TableHead className="w-8 pr-0" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chats.map((chat) => (
                      <TableRow
                        key={chat.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/chats/${chat.id}`)}
                      >
                        <TableCell>
                          <Link
                            href={`/chats/${chat.id}`}
                            className="font-medium"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {chat.name?.trim() || 'Untitled chat'}
                          </Link>
                        </TableCell>
                        <TableCell
                          className={
                            chat.published
                              ? undefined
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        >
                          {chat.published ? 'Published' : 'Draft'}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          {formatChatDate(chat.lastUsedAt, 'Never')}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400 hidden md:table-cell">
                          {formatChatDate(chat.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right text-gray-400 dark:text-gray-500 pr-0">
                          →
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
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
  });
}
