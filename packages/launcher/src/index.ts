/**
 * Explainit Launcher — vanilla IIFE for the Host site.
 * Do not import app modules; this file is the CDN Install artifact.
 */

const HOST_ID = 'explainit-widget-host';
const STYLE_ID = 'explainit-launcher-style';

/** Captured when this IIFE evaluates (document.currentScript is null later). */
const launcherSrcAtLoad =
  typeof document !== 'undefined' &&
  document.currentScript instanceof HTMLScriptElement
    ? document.currentScript.src
    : '';

export type ExplainitOptions = {
  /** Chat id from the dashboard Install snippet. */
  chatId: string;
  /**
   * API origin for visitor chat (`GET/POST /api/chats/:id`).
   * The dashboard fills this in. It is not the Host site origin.
   */
  apiUrl: string;
  /**
   * Host-owned control that opens Ask AI. Pass an element or a CSS selector.
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

function cdnSibling(fileName: string): string {
  if (launcherSrcAtLoad) {
    return launcherSrcAtLoad.replace(/[^/]+$/, fileName);
  }
  const scripts = document.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].src;
    if (src && /launcher\.js(\?|$)/.test(src)) {
      return src.replace(/[^/]+$/, fileName);
    }
  }
  return fileName;
}

function ensureHostStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${HOST_ID} {
      z-index: 2147483001;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      pointer-events: none;
    }
    #${HOST_ID}.is-open {
      pointer-events: auto;
    }
    body.explainit-host-open { overflow: hidden; }
  `;
  document.head.appendChild(style);
}

type WidgetMountFn = (
  shadowRoot: ShadowRoot,
  opts: {
    chatId: string;
    apiUrl: string;
    onClose?: () => void;
  },
) => () => void;

function resolveWidgetMount(): WidgetMountFn | undefined {
  const api = window.ExplainitWidget as
    | { mount?: WidgetMountFn; default?: { mount?: WidgetMountFn } }
    | undefined;
  if (typeof api?.mount === 'function') {
    return api.mount;
  }
  if (typeof api?.default?.mount === 'function') {
    return api.default.mount;
  }
  return undefined;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-explainit-widget="1"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (resolveWidgetMount()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Explainit widget')),
      );
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.explainitWidget = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Explainit widget'));
    document.head.appendChild(script);
  });
}

function ensureCss(shadow: ShadowRoot) {
  if (shadow.querySelector('link[data-explainit-widget-css]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cdnSibling('widget.css');
  link.dataset.explainitWidgetCss = '1';
  shadow.appendChild(link);
}

function mountLauncher(config: {
  chatId: string;
  apiUrl: string;
  button: HTMLElement;
}): ExplainitInstance {
  ensureHostStyles();

  let host: HTMLElement | null = null;
  let shadow: ShadowRoot | null = null;
  let unmount: (() => void) | null = null;
  let open = false;

  const close = () => {
    open = false;
    host?.classList.remove('is-open');
    document.body.classList.remove('explainit-host-open');
    unmount?.();
    unmount = null;
  };

  const openWidget = async () => {
    if (!host) {
      host = document.createElement('div');
      host.id = HOST_ID;
      document.body.appendChild(host);
      shadow = host.attachShadow({ mode: 'closed' });
    }
    if (!shadow) {
      return;
    }

    ensureCss(shadow);
    await loadScript(cdnSibling('widget.js'));

    const mount = resolveWidgetMount();
    if (!mount) {
      throw new Error('Explainit widget failed to register');
    }

    unmount?.();
    open = true;
    host.classList.add('is-open');
    document.body.classList.add('explainit-host-open');

    // Refresh selection at open time for the widget's first paint.
    void getSelectionText();

    unmount = mount(shadow, {
      chatId: config.chatId,
      apiUrl: config.apiUrl,
      onClose: close,
    });
  };

  const onClick = () => {
    if (open) {
      close();
      return;
    }
    void openWidget().catch((err) => {
      console.error(err);
      close();
    });
  };

  config.button.addEventListener('click', onClick);

  return {
    destroy() {
      config.button.removeEventListener('click', onClick);
      close();
      host?.remove();
      host = null;
      shadow = null;
      document.getElementById(STYLE_ID)?.remove();
    },
  };
}

/**
 * Start the Launcher on the Host page. `Chat.hostOrigins` is the API Origin
 * whitelist — enforced by Nest, not by this call.
 */
export default function explainit(
  options: ExplainitOptions,
): ExplainitInstance | undefined {
  const chatId = options?.chatId?.trim();
  const apiUrl = options?.apiUrl ? trimSlash(options.apiUrl.trim()) : '';
  const button = options?.button ? resolveButton(options.button) : null;
  if (!chatId || !apiUrl || !button) {
    return undefined;
  }
  try {
    new URL(apiUrl);
  } catch {
    return undefined;
  }
  return mountLauncher({ chatId, apiUrl, button });
}

declare global {
  interface Window {
    explainit: typeof explainit;
    ExplainitWidget?: {
      mount: (
        shadowRoot: ShadowRoot,
        opts: {
          chatId: string;
          apiUrl: string;
          onClose?: () => void;
        },
      ) => () => void;
    };
  }
}

if (typeof window !== 'undefined') {
  window.explainit = explainit;
}
