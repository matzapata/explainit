"use client";

import { chatService } from "@/lib/services/chat-service";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function DeleteMessages(props: { id: string }) {
  const { accessTokenRaw } = useKindeBrowserClient();

  const clearMessages = async () => {
    if (
      window.confirm("Are you sure you want to clear all messages?") === false
    ) {
      return;
    }

    try {
      if (!accessTokenRaw) {
        throw new Error("No access token");
      }
      await chatService.clearMessages(accessTokenRaw, props.id);
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to clear messages",
      });
    }
  };

  return (
    <Button
      onClick={() => clearMessages()}
      variant={"link-gray"}
      size={"sm"}
      className="text-gray-600 dark:text-gray-300"
    >
      Delete messages
    </Button>
  );
}
