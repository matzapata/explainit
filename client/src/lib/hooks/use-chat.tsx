import { useState } from "react";
import {
  ChatMessage,
  MessageRole,
  chatService,
} from "@/lib/services/chat-service";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { apiService } from "../services/api-service";

export default function useChat(
  chatId: string,
  initialMessages: ChatMessage[] = []
) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const append = async (message: string) => {
    setMessages((prev) => [
      ...prev,
      { content: message, role: MessageRole.user, context: [] },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      if (!accessTokenRaw) {
        throw new Error("No access token");
      }

      // append the message
      const response = await chatService.postMessage(accessTokenRaw, chatId, message);
      setMessages((prev) => [
        ...prev,
        { content: response.content, role: MessageRole.ai, context: response.context },
      ]);
    } catch (error) {
      console.error(error);
      alert("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, setMessages, isLoading, input, setInput, append };
}
