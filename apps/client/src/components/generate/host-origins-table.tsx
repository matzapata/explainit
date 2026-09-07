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
import { useAccessToken } from '@/lib/auth/use-session';
import { chatService } from '@/lib/services/chat-service';
import { toast } from '../ui/use-toast';

const MAX_HOST_ORIGINS = 20;

const formSchema = z.object({
  origin: z.string().url({ message: 'Must be a valid URL' }),
});

function originFromUrl(value: string): string | null {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

export default function HostOriginsTable(props: {
  chatId: string;
  hostOrigins: string[];
  onHostOriginsChange?: (origins: string[]) => void;
}) {
  const accessTokenRaw = useAccessToken();
  const [origins, setOrigins] = useState<string[]>(props.hostOrigins ?? []);
  const [open, setOpen] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: '',
    },
  });

  const applyOrigins = (next: string[]) => {
    setOrigins(next);
    props.onHostOriginsChange?.(next);
  };

  const addOriginMutation = useMutation({
    mutationFn: (mutationProps: { origin: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      const next = originFromUrl(mutationProps.origin);
      if (!next) throw new Error('Invalid origin');
      if (origins.includes(next)) {
        throw new Error('Origin already allowlisted');
      }
      if (origins.length >= MAX_HOST_ORIGINS) {
        throw new Error(`At most ${MAX_HOST_ORIGINS} Host origins`);
      }
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, {
        hostOrigins: [...origins, next],
      });
    },
    onSuccess: (data) => {
      applyOrigins(data.hostOrigins ?? []);
      toast({ description: 'Host origin added.' });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        description:
          error instanceof Error
            ? error.message
            : 'Sorry, something went wrong. Please try again.',
      });
    },
  });

  const deleteOriginMutation = useMutation({
    mutationFn: (mutationProps: { origin: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, {
        hostOrigins: origins.filter((o) => o !== mutationProps.origin),
      });
    },
    onSuccess: (data) => {
      applyOrigins(data.hostOrigins ?? []);
      toast({ description: 'Successfully removed.' });
    },
    onError: () => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addOriginMutation.mutate(values);
  }

  return (
    <div className="space-y-2 md:space-y-0 py-6">
      <div className="md:flex items-start">
        <div className="md:w-64 space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
            Host origins
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 pr-4">
            Origins that may call the visitor API. Exact matches only — www and
            apex are different. The Install snippet is identical on every listed
            origin.
          </p>
        </div>
        <div className="flex-1 divide-y divide-gray-200 dark:divide-gray-800">
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {origins.map((origin) => (
              <div
                key={origin}
                className="flex md:flex-1 justify-between py-4 items-center"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  {origin}
                </p>

                <Button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Remove this Host origin from the allowlist?',
                      )
                    ) {
                      deleteOriginMutation.mutate({ origin });
                    }
                  }}
                  className="text-sm dark:text-red-600"
                  variant="link"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </ul>

          <div className="flex md:flex-1 py-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="text-sm px-0 text-primary" variant="link">
                  Add origin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add a Host origin</DialogTitle>
                  <DialogDescription>
                    Paste a full URL; only its origin is stored (e.g.
                    https://www.demo.com/docs → https://www.demo.com).
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host URL or origin</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://www.demo.com"
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
                        isLoading={addOriginMutation.isPending}
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
      </div>
    </div>
  );
}
