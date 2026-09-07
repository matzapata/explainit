import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AskAiOverlay, type PageContext } from '@/components/chat/ask-ai-overlay';
import { TooltipProvider } from '@/components/ui/tooltip';
import { chatService, ChatMetadataDto } from '@/lib/services/chat-service';
import './index.css';

window.__EXPLAINIT_HOST_FRAME__ = true;
// Host Chat HTML is served by Nest; API is same origin (empty base).
window.__EXPLAINIT_API_BASE__ = '';

const EXPLAINIT_PAGE_CONTEXT = 'explainit:page-context';
const EXPLAINIT_CLOSE = 'explainit:close';

export function HostFrameApp() {
  const chatId = window.__EXPLAINIT_CHAT_ID__;
  const [chat, setChat] = useState<ChatMetadataDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState<PageContext>({});
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setError('Missing Chat id');
      return;
    }
    chatService
      .getChat(chatId)
      .then(setChat)
      .catch(() => setError('Chat not available'));
  }, [chatId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === EXPLAINIT_PAGE_CONTEXT) {
        setOpen(true);
        setPageContext({
          pageUrl:
            typeof event.data.pageUrl === 'string'
              ? event.data.pageUrl
              : undefined,
          selectedText:
            typeof event.data.selectedText === 'string'
              ? event.data.selectedText
              : undefined,
        });
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'explainit:ready' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      window.parent.postMessage({ type: EXPLAINIT_CLOSE }, '*');
    }
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-black/80 text-white">
        {error}
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex h-full items-center justify-center bg-black/80 text-white">
        Loading…
      </div>
    );
  }

  return (
    <AskAiOverlay
      chat={chat}
      open={open}
      onOpenChange={onOpenChange}
      pageContext={pageContext}
    />
  );
}

const queryClient = new QueryClient();
const root = document.getElementById('root');
if (root && !import.meta.env.VITEST) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <HostFrameApp />
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
