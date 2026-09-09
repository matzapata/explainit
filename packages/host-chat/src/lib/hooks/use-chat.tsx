import { useRef, useState } from 'react';
import type { PageContext } from '../../components/chat/ask-ai-overlay';
import { type ChatMessage, MessageRole } from '../types';
import { streamMessage } from '../visitor-api';

function conversationStorageKey(chatId: string): string {
  return `explainit_conversation:${chatId}`;
}

function readStoredConversationId(chatId: string): string | undefined {
  if (typeof window === 'undefined' || !window.__EXPLAINIT_WIDGET__) {
    return undefined;
  }
  try {
    return localStorage.getItem(conversationStorageKey(chatId)) || undefined;
  } catch {
    return undefined;
  }
}

function writeStoredConversationId(chatId: string, id: string) {
  if (typeof window === 'undefined' || !window.__EXPLAINIT_WIDGET__) {
    return;
  }
  try {
    localStorage.setItem(conversationStorageKey(chatId), id);
  } catch {
    // private mode / quota
  }
}

function livePageContext(
  current: PageContext | undefined,
): PageContext | undefined {
  if (typeof window === 'undefined' || !window.__EXPLAINIT_WIDGET__) {
    return current;
  }
  const selectedText = window.getSelection()?.toString()?.trim() || undefined;
  return {
    pageUrl: window.location.href,
    selectedText: selectedText || current?.selectedText,
  };
}

export default function useChat(
  chatId: string,
  initialMessages: ChatMessage[] = [],
  pageContext?: PageContext,
  accessToken?: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const streamedRef = useRef('');
  const pageContextRef = useRef(pageContext);
  pageContextRef.current = pageContext;
  const conversationIdRef = useRef<string | undefined>(
    readStoredConversationId(chatId),
  );

  const stop = () => {
    abortRef.current?.abort();
  };

  const append = async (message: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    streamedRef.current = '';

    setMessages((prev) => [
      ...prev,
      { content: message, role: MessageRole.user, context: [] },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const ctx = livePageContext(pageContextRef.current);
      pageContextRef.current = ctx;
      const response = await streamMessage(chatId, message, {
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
            return [...next, { content, role: MessageRole.ai, context: [] }];
          });
        },
        pageUrl: ctx?.pageUrl,
        selectedText: ctx?.selectedText,
        accessToken,
        conversationId: conversationIdRef.current,
        onConversationId: (id) => {
          conversationIdRef.current = id;
          writeStoredConversationId(chatId, id);
        },
      });
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
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error(error);
      alert('Failed to send message');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  };

  return { messages, setMessages, isLoading, input, setInput, append, stop };
}
