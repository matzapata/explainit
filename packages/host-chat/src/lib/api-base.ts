declare global {
  interface Window {
    __EXPLAINIT_WIDGET__?: boolean;
    __EXPLAINIT_API_BASE__?: string;
    __EXPLAINIT_CHAT_ID__?: string;
    ExplainitWidget?: {
      mount: (
        shadowRoot: ShadowRoot,
        opts: {
          chatId: string;
          apiUrl: string;
          theme?: 'light' | 'dark' | 'system';
          onClose?: () => void;
        },
      ) => () => void;
    };
  }
}

export function apiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.__EXPLAINIT_API_BASE__ !== undefined) {
    return window.__EXPLAINIT_API_BASE__.replace(/\/$/, '');
  }
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw === undefined || raw === '') {
    return '';
  }
  return raw.replace(/\/$/, '');
}
