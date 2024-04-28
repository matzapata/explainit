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
import { chatService } from '@/lib/services/chat-service';

const formSchema = z.object({
  file:  typeof window === 'undefined' ? z.any() : z
    .instanceof(FileList)
    .refine((file) => file?.length == 1, 'Image is required.'),
});

export default function LogoForm(props: { logo?: string }) {

  const { accessTokenRaw } = useKindeBrowserClient();
  const [open, setOpen] = useState<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(props.logo);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });
  const fileRef = form.register('file');

  const uploadPicture = useMutation({
    mutationFn: (props: { file: FileList }) => {
      if (!accessTokenRaw) throw new Error('No access token');

      const file = props.file[0];
      if (!file.type.includes("image")) throw new Error("Invalid file type");

      return chatService.updateOwnerChatLogo(accessTokenRaw, file)
    },
    onSuccess: (data) => {
      setLogoUrl(data.logo);
      toast({ description: 'Logo updated successfully.' });
      setOpen(false);
    },
    onError: (error) => {
      toast({ description: `Sorry, something went wrong. Please try again.${error.message? " Error" + error.message : ""}` });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    uploadPicture.mutate(values as any);
  }

  return (
    <div className="space-y-2 md:space-y-0 md:flex py-6">
      <p className="text-sm md:w-64 flex items-center font-medium text-gray-900 dark:text-gray-300">
        Logo
      </p>
      <div className="flex md:flex-1 justify-between">
        <Avatar>
          <AvatarImage src={logoUrl} />
          <AvatarFallback>
            C
          </AvatarFallback>
        </Avatar>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="text-sm text-primary" variant="link">
              Update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Picture</DialogTitle>
              <DialogDescription>
                Use the logo of your company or organization. Maximum file size is 1MB. Allowed formats PNG/JPG/JPEG.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <Input className='text-gray-500' type="file" placeholder="Picture" {...fileRef} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" isLoading={uploadPicture.isPending}>
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
