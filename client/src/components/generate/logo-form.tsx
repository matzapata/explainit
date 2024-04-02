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
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const formSchema = z.object({
  website: z.string().min(2, {
    message: 'Website must be a url', // TODO: Add proper validation
  }),
});

export default function LogoForm(props: { logo?: string }) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [open, setOpen] = useState<boolean>(false);
  const [website, setWebsite] = useState<string | undefined>(props.logo);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      website: '',
    },
  });

  const setNameMutation = useMutation({
    mutationFn: (props: { website: string }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return Promise.resolve({ website: props.website });
    },
    onSuccess: (data) => {
      setWebsite(data.website);
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
    <div className="space-y-2 md:space-y-0 md:flex py-6">
      <p className="text-sm md:w-64 flex items-center font-medium text-gray-900 dark:text-gray-300">
        Logo
      </p>
      <div className="flex md:flex-1 justify-between">
        {/* <p className="text-sm text-gray-900 dark:text-gray-300">{website ?? "-"}</p> */}
        <Avatar>
          {/* TODO: add image */}
          <AvatarImage src={undefined} />
          <AvatarFallback>
            {/* {Array.from(props.user?.email ?? "c")[0].toUpperCase()} */}C
          </AvatarFallback>
        </Avatar>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="text-sm" variant="link-color">
              Update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Website</DialogTitle>
              <DialogDescription>
                Make changes to your website url here. People will use this link
                to go straight to your docs. Don't worry, you can provide more
                data to the chat later. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Website" {...field} />
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
