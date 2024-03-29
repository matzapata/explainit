"use client";

import { cn } from "@/lib/utils";
import { ChatList } from "@/components/chat/chat-list";
import { ChatPanel } from "@/components/chat/chat-panel";
import { EmptyScreen } from "@/components/chat/empty-screen";
import { ChatScrollAnchor } from "@/components/chat/chat-scroll-anchor";
import React from "react";
import useChat from "@/lib/hooks/use-chat";
import { ChatMessage } from "@/lib/services/chat-service";
import { ChatMessageLoading } from "./chat-message-loading";

export interface ChatProps extends React.ComponentProps<"div"> {
  initialMessages?: ChatMessage[];
  id: string;
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const { messages, isLoading, input, setInput, append } =
    useChat(id, initialMessages);

  return (
    <>
      <div className={cn("pb-[200px] pt-4 md:pt-10", className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} loading={isLoading} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        append={append}
        messages={messages}
        input={input}
        setInput={setInput}
      />
    </>
  );
}
