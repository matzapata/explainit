/**
 * Explainit Launcher — vanilla IIFE for the Host site.
 * Do not import app modules; this file is the CDN Install artifact.
 */

const READY = 'explainit:ready';
const PAGE_CONTEXT = 'explainit:page-context';
const CLOSE = 'explainit:close';
const STYLE_ID = 'explainit-launcher-style';

export type ExplainitOptions = {
  /** Chat id from the dashboard Install snippet. */
  chatId: string;
  /**
   * Origin that serves Host Chat (`GET /host/:id`).
   * The dashboard fills this in. It is not the Host site origin.
   */
  appUrl: string;
  /**
   * Host-owned control that opens Host Chat. Pass an element or a CSS selector.
   * The Launcher does not create this control.
   */
  button: HTMLElement | string;
};

export type ExplainitInstance = {
  destroy: () => void;
};

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function getSelectionText(): string {
  const selection = window.getSelection()?.toString()?.trim();
  return selection ?? '';
}

function resolveButton(button: HTMLElement | string): HTMLElement | null {
  if (typeof button === 'string') {
    const el = document.querySelector(button);
    return el instanceof HTMLElement ? el : null;
  }
  return button instanceof HTMLElement ? button : null;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .explainit-host-frame {
      z-index: 2147483001;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      display: none;
      background: transparent;
    }
    .explainit-host-frame.is-open { display: block; }
    body.explainit-host-open { overflow: hidden; }
  `;
  document.head.appendChild(style);
}

function mountLauncher(config: {
  chatId: string;
  appUrl: string;
  button: HTMLElement;
}): ExplainitInstance {
  ensureStyles();

  let iframe: HTMLIFrameElement | null = null;
  let open = false;
  let frameReady = false;

  const postPageContext = () => {
    if (!iframe?.contentWindow || !frameReady) return;
    try {
      iframe.contentWindow.postMessage(
        {
          type: PAGE_CONTEXT,
          pageUrl: window.location.href,
          selectedText: getSelectionText(),
        },
        config.appUrl,
      );
    } catch {
      // iframe is still about:blank (or CSP-blocked) — wait for explainit:ready
    }
  };

  const close = () => {
    open = false;
    iframe?.classList.remove('is-open');
    document.body.classList.remove('explainit-host-open');
  };

  const ensureIframe = () => {
    if (iframe) return iframe;
    iframe = document.createElement('iframe');
    iframe.className = 'explainit-host-frame';
    iframe.title = 'Ask AI';
    iframe.allow = 'clipboard-write';
    iframe.src = `${config.appUrl}/host/${encodeURIComponent(config.chatId)}`;
    document.body.appendChild(iframe);
    return iframe;
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== config.appUrl) return;
    if (!event.data || typeof event.data !== 'object') return;
    if (
      event.data.type === READY ||
      event.data.type === 'explainit:request-context'
    ) {
      frameReady = true;
      postPageContext();
    }
    if (event.data.type === CLOSE) {
      close();
    }
  };

  window.addEventListener('message', onMessage);

  const onClick = () => {
    if (open) {
      close();
      return;
    }
    const frame = ensureIframe();
    open = true;
    frame.classList.add('is-open');
    document.body.classList.add('explainit-host-open');
    postPageContext();
  };

  config.button.addEventListener('click', onClick);

  return {
    destroy() {
      config.button.removeEventListener('click', onClick);
      window.removeEventListener('message', onMessage);
      close();
      iframe?.remove();
      iframe = null;
      document.getElementById(STYLE_ID)?.remove();
    },
  };
}

/**
 * Start the Launcher on the Host page. Website (`Chat.url`) is the
 * whitelist, enforced by Host Chat `frame-ancestors` — not by this call.
 */
export default function explainit(
  options: ExplainitOptions,
): ExplainitInstance | undefined {
  const chatId = options?.chatId?.trim();
  const appUrl = options?.appUrl ? trimSlash(options.appUrl.trim()) : '';
  const button = options?.button ? resolveButton(options.button) : null;
  if (!chatId || !appUrl || !button) {
    return undefined;
  }
  try {
    // Reject relative paths; Host Chat lives on Explainit's origin.
    new URL(appUrl);
  } catch {
    return undefined;
  }
  return mountLauncher({ chatId, appUrl, button });
}

declare global {
  interface Window {
    explainit: typeof explainit;
  }
}

if (typeof window !== 'undefined') {
  window.explainit = explainit;
}
