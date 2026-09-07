"use client";

import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "../ui/use-toast";
import { useAccessToken } from "@/lib/auth/use-session";
import { chatService } from "@/lib/services/chat-service";

const formSchema = z.object({
  website: z.string().url({ message: "Website must be a url" }),
});

export default function WebsiteForm(props: { chatId: string, website?: string }) {
  const accessTokenRaw = useAccessToken();
  const [open, setOpen] = useState<boolean>(false);
  const [website, setWebsite] = useState<string | undefined>(props.website);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      website: "",
    },
  });

  const setNameMutation = useMutation({
    mutationFn: (mutationProps: { website: string }) => {
      if (!accessTokenRaw) throw new Error("No access token");
      return chatService.updateOwnerChat(accessTokenRaw, props.chatId, { url: mutationProps.website });
    },
    onSuccess: (data) => {
      setWebsite(data.url);
      toast({ description: "Website updated successfully." });
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
    <div className="space-y-2 md:space-y-0 md:flex items-center py-6">
      <p className="text-sm md:w-64 font-medium text-gray-900 dark:text-gray-300">
        Host website
      </p>
      <div className="flex md:flex-1 items-center justify-between">
        <p className="text-sm text-gray-900 dark:text-gray-300">{website ?? "-"}</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="text-sm text-primary" variant="link">
              Update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Host website</DialogTitle>
              <DialogDescription>
                Set the docs site origin that may call the visitor API (e.g.
                http://localhost:8080 or https://docs.example.com). Only that
                origin is allowlisted.
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
                      <FormLabel>Host website URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://docs.example.com"
                          {...field}
                        />
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
