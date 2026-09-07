import { useRef, useState } from "react";
import {
  ChatMessage,
  MessageRole,
  chatService,
} from "@/lib/services/chat-service";
import { getAccessToken } from "@/lib/auth/config";
import type { PageContext } from "@/components/chat/ask-ai-overlay";

async function refreshHostPageContext(
  current: PageContext | undefined,
): Promise<PageContext | undefined> {
  if (typeof window === "undefined" || !window.__EXPLAINIT_HOST_FRAME__) {
    return current;
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(current), 150);
    const onMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== "explainit:page-context") return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve({
        pageUrl:
          typeof event.data.pageUrl === "string"
            ? event.data.pageUrl
            : current?.pageUrl,
        selectedText:
          typeof event.data.selectedText === "string"
            ? event.data.selectedText
            : current?.selectedText,
      });
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "explainit:request-context" }, "*");
  });
}

export default function useChat(
  chatId: string,
  initialMessages: ChatMessage[] = [],
  pageContext?: PageContext,
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const streamedRef = useRef("");
  const pageContextRef = useRef(pageContext);
  pageContextRef.current = pageContext;

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
      const ctx = await refreshHostPageContext(pageContextRef.current);
      pageContextRef.current = ctx;
      const token = getAccessToken();
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
          pageUrl: ctx?.pageUrl,
          selectedText: ctx?.selectedText,
          accessToken: token || undefined,
        },
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
