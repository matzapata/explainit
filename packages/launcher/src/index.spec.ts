import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import explainit, { type ExplainitInstance } from './index';

function hostButton(id = 'ask-ai'): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.textContent = 'Ask AI';
  document.body.appendChild(button);
  return button;
}

describe('explainit()', () => {
  let instance: ExplainitInstance | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('#explainit-launcher-style').forEach((n) => {
      n.remove();
    });
    vi.stubGlobal('location', {
      ...window.location,
      origin: 'https://docs.example.com',
      href: 'https://docs.example.com/guide',
    });
  });

  afterEach(() => {
    instance?.destroy();
    instance = undefined;
  });

  it('no-ops when chatId, appUrl, or button is missing', () => {
    hostButton();
    expect(
      explainit({ chatId: '', appUrl: 'https://app.example.com', button: '#ask-ai' }),
    ).toBeUndefined();
    expect(
      explainit({
        chatId: 'chat-1',
        appUrl: '' as unknown as string,
        button: '#ask-ai',
      }),
    ).toBeUndefined();
    expect(
      explainit({
        chatId: 'chat-1',
        appUrl: 'https://app.example.com',
        button: '#missing',
      }),
    ).toBeUndefined();
    expect(document.querySelector('iframe.explainit-host-frame')).toBeNull();
  });

  it('does not inject a Host control of its own', () => {
    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      appUrl: 'https://app.example.com',
      button,
    });

    expect(document.querySelectorAll('button')).toHaveLength(1);
    expect(document.querySelector('.explainit-launcher-btn')).toBeNull();
  });

  it('opens a Host Chat iframe at appUrl/host/:id from the Host control', () => {
    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      appUrl: 'https://app.example.com',
      button: '#ask-ai',
    });

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const iframe = document.querySelector(
      'iframe.explainit-host-frame',
    ) as HTMLIFrameElement | null;
    expect(iframe).toBeTruthy();
    expect(iframe?.src).toBe('https://app.example.com/host/chat-1');
    expect(iframe?.classList.contains('is-open')).toBe(true);
  });

  it('posts page context after Host Chat is ready, not on click', () => {
    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      appUrl: 'https://app.example.com',
      button,
    });

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const iframe = document.querySelector(
      'iframe.explainit-host-frame',
    ) as HTMLIFrameElement;
    const postMessage = vi
      .spyOn(iframe.contentWindow!, 'postMessage')
      .mockImplementation(() => undefined);

    expect(postMessage).not.toHaveBeenCalled();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://app.example.com',
        data: { type: 'explainit:ready' },
      }),
    );

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'explainit:page-context',
        pageUrl: 'https://docs.example.com/guide',
      }),
      'https://app.example.com',
    );
  });

  it('shows Host Chat again after close', () => {
    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      appUrl: 'https://app.example.com',
      button,
    });

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const iframe = document.querySelector(
      'iframe.explainit-host-frame',
    ) as HTMLIFrameElement;
    expect(iframe.classList.contains('is-open')).toBe(true);

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://app.example.com',
        data: { type: 'explainit:close' },
      }),
    );
    expect(iframe.classList.contains('is-open')).toBe(false);

    const postMessage = vi
      .spyOn(iframe.contentWindow!, 'postMessage')
      .mockImplementation(() => undefined);

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://app.example.com',
        data: { type: 'explainit:ready' },
      }),
    );
    postMessage.mockClear();

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(iframe.classList.contains('is-open')).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'explainit:page-context' }),
      'https://app.example.com',
    );
  });

  it('destroy removes Host Chat from the page and leaves the Host control', () => {
    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      appUrl: 'https://app.example.com',
      button,
    });
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    instance?.destroy();
    instance = undefined;

    expect(document.getElementById('ask-ai')).toBe(button);
    expect(document.querySelector('iframe.explainit-host-frame')).toBeNull();
    expect(document.getElementById('explainit-launcher-style')).toBeNull();
  });
});
