"use client";

import { Button } from "../ui/button";

export default function DeleteMessages(props: { disabled: boolean, clearMessages: () => void }) {
  const clearMessages = () => {
    if (
      window.confirm("Are you sure you want to clear all messages?") === false
    ) {
      return;
    }

    clearMessages();
  };

  return (
    <Button
      disabled={props.disabled}
      onClick={() => clearMessages()}
      variant={"link-gray"}
      size={"sm"}
      className="text-gray-600 dark:text-gray-300"
    >
      Delete messages
    </Button>
  );
}
