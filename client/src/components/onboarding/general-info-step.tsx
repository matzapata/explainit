'use client';

import { ChatMetadataDto, chatService } from '@/lib/services/chat-service';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button, buttonVariants } from '../ui/button';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '../ui/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  url: z.string().url({
    message: 'Website must be a valid URL.',
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

export function GeneralInfoStep(props: {
  chat: ChatMetadataDto;
}) {
  const router = useRouter()
  const { accessTokenRaw } = useKindeBrowserClient();
  const [logoUrl, setLogoUrl] = useState<string | undefined>(props.chat.logo);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: props.chat.name ?? '',
      description: props.chat.description ?? '',
      url: props.chat.url ?? '',
    },
  });

  const generalInfoMutation = useMutation({
    mutationFn: (mutationProps: {
      name: string;
      url: string;
      description: string;
    }) => {
      if (!accessTokenRaw) throw new Error('No access token');
      return chatService.updateOwnerChat(accessTokenRaw, props.chat.id, mutationProps);
    },
    onSuccess: (data) => {
      router.push('/onboarding/resources')
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.` });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.name !== props.chat.name || values.description !== props.chat.description || values.url !== props.chat.url) {
      generalInfoMutation.mutate(values);
    } else {
      router.push('/onboarding/resources')
    }
  }

  const uploadPicture = useMutation({
    mutationFn: (mutationProps: { file: FileList }) => {
      if (!accessTokenRaw) throw new Error('No access token');

      const file = mutationProps.file[0];
      if (!file.type.includes("image")) throw new Error("Invalid file type");

      return chatService.updateOwnerChatLogo(accessTokenRaw, props.chat.id, file)
    },
    onSuccess: (data) => {
      setLogoUrl(data.logo);
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.${error.message? " Error" + error.message : ""}` });
    },
  });

  return (
    <>
      <div className="border-b border-b-gray-800 pb-6 mb-6">
        <h1 className="text-white text-lg font-medium">
          Let's create your chat
        </h1>
        <p className="text-gray-300">
          Add your chat's name, logo and description. This information will be
          displayed on the chat page.
        </p>
      </div>

      <div className="space-y-4 border-gray-800 divide-gray-800">
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 rounded-md">
              <AvatarImage className="rounded-md" src={logoUrl} />
              <AvatarFallback className="rounded-md">C</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <label htmlFor="logo" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "cursor-pointer")}>
                {uploadPicture.isPending ? 'Uploading...' : 'Upload logo'}
              </label>
              <Input id='logo' disabled={uploadPicture.isPending} className='hidden' type="file" accept=".jpg, .png, .jpeg" onChange={(e) => {
                const file = e.target.files;
                if (file) {
                  uploadPicture.mutate({ file });
                }
              }} />
              <p className="text-gray-500 text-xs">
                .png, .jpeg files up to 1MB. Recommended size is 50x50px
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
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
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className='text-sm' {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="justify-center space-x-2 flex w-full mt-6">
              <Button
                variant={'outline'}
                type="submit"
                isLoading={generalInfoMutation.isPending}
              >
                Next
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
