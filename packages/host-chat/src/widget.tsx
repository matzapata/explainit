import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  AskAiOverlay,
  type PageContext,
} from './components/chat/ask-ai-overlay';
import { HostThemeRoot } from './components/chat/host-theme-root';
import { TooltipProvider } from './components/ui/tooltip';
import { allowWheelThroughScrollLock } from './lib/composed-wheel-scroll';
import type { HostTheme } from './lib/host-theme';
import { PortalContainerContext } from './lib/portal-container';
import type { ChatMetadata } from './lib/types';
import { getChat } from './lib/visitor-api';
import './lib/api-base';
import './index.css';

export type WidgetMountOptions = {
  chatId: string;
  apiUrl: string;
  /** Host-provided appearance. `system` follows prefers-color-scheme. */
  theme?: HostTheme;
  onClose?: () => void;
};

export function WidgetApp(props: {
  chatId: string;
  onClose?: () => void;
  pageContext?: PageContext;
}) {
  const [chat, setChat] = useState<ChatMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [pageContext, setPageContext] = useState<PageContext>(
    props.pageContext ?? {
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      selectedText: undefined,
    },
  );

  useEffect(() => {
    if (!props.chatId) {
      setError('Missing Chat id');
      return;
    }
    getChat(props.chatId)
      .then(setChat)
      .catch(() => setError('Chat not available'));
  }, [props.chatId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setPageContext({
      pageUrl: window.location.href,
      selectedText: window.getSelection()?.toString()?.trim() || undefined,
    });
  }, [open]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        props.onClose?.();
      }
    },
    [props],
  );

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

function mount(shadowRoot: ShadowRoot, opts: WidgetMountOptions): () => void {
  window.__EXPLAINIT_WIDGET__ = true;
  window.__EXPLAINIT_API_BASE__ = opts.apiUrl.replace(/\/$/, '');
  window.__EXPLAINIT_CHAT_ID__ = opts.chatId;

  let mountPoint = shadowRoot.querySelector(
    '#explainit-root',
  ) as HTMLElement | null;
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'explainit-root';
    mountPoint.style.cssText = 'height:100%;width:100%;';
    shadowRoot.appendChild(mountPoint);
  }

  const queryClient = new QueryClient();
  const root = ReactDOM.createRoot(mountPoint);
  const onWheel = (event: WheelEvent) => {
    allowWheelThroughScrollLock(event, shadowRoot);
  };
  // Register before Dialog mounts so this runs ahead of Radix RemoveScroll.
  document.addEventListener('wheel', onWheel, {
    capture: true,
    passive: false,
  });
  root.render(
    <React.StrictMode>
      <PortalContainerContext.Provider value={mountPoint}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <HostThemeRoot theme={opts.theme}>
              <WidgetApp chatId={opts.chatId} onClose={opts.onClose} />
            </HostThemeRoot>
          </TooltipProvider>
        </QueryClientProvider>
      </PortalContainerContext.Provider>
    </React.StrictMode>,
  );

  return () => {
    document.removeEventListener('wheel', onWheel, {
      capture: true,
    });
    root.unmount();
  };
}

export { mount };

const ExplainitWidget = { mount };

if (typeof window !== 'undefined') {
  window.ExplainitWidget = ExplainitWidget;
}

export default ExplainitWidget;
