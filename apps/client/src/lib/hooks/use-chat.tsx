import { useRef, useState } from "react";
import {
  ChatMessage,
  MessageRole,
  chatService,
} from "@/lib/services/chat-service";

export default function useChat(
  chatId: string,
  initialMessages: ChatMessage[] = []
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const streamedRef = useRef("");

  const stop = () => {
    abortRef.current?.abort();
  };

  const append = async (message: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    streamedRef.current = "";

    setMessages((prev) => [
      ...prev,
      { content: message, role: MessageRole.user, context: [] },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatService.streamMessage(
        chatId,
        message,
        messages.map((m) => ({
          agent: m.role,
          message: m.content,
        })),
        {
          signal: controller.signal,
          onToken: (text) => {
            streamedRef.current += text;
            const content = streamedRef.current;
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === MessageRole.ai) {
                next[next.length - 1] = { ...last, content };
                return next;
              }
              return [
                ...next,
                { content, role: MessageRole.ai, context: [] },
              ];
            });
          },
        }
      );
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === MessageRole.ai) {
          next[next.length - 1] = {
            content: response.content,
            role: MessageRole.ai,
            context: response.context,
          };
          return next;
        }
        return [...next, response];
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      console.error(error);
      alert("Failed to send message");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  };

  return { messages, setMessages, isLoading, input, setInput, append, stop };
}
