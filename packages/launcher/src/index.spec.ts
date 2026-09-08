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
    document.head
      .querySelectorAll('script[data-explainit-widget]')
      .forEach((n) => {
        n.remove();
      });
    delete window.ExplainitWidget;
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

  it('no-ops when chatId, apiUrl, or button is missing', () => {
    hostButton();
    expect(
      explainit({
        chatId: '',
        apiUrl: 'https://api.example.com',
        button: '#ask-ai',
      }),
    ).toBeUndefined();
    expect(
      explainit({
        chatId: 'chat-1',
        apiUrl: '' as unknown as string,
        button: '#ask-ai',
      }),
    ).toBeUndefined();
    expect(
      explainit({
        chatId: 'chat-1',
        apiUrl: 'https://api.example.com',
        button: '#missing',
      }),
    ).toBeUndefined();
    expect(document.getElementById('explainit-widget-host')).toBeNull();
  });

  it('does not inject a Host control of its own', () => {
    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      apiUrl: 'https://api.example.com',
      button,
    });

    expect(document.querySelectorAll('button')).toHaveLength(1);
    expect(document.querySelector('.explainit-launcher-btn')).toBeNull();
  });

  it('opens an in-page ShadowRoot widget with apiUrl', async () => {
    const mount = vi.fn(() => () => undefined);
    window.ExplainitWidget = { mount };

    // Pretend widget.js is already loaded so loadScript resolves immediately.
    const button = hostButton();
    const script = document.createElement('script');
    script.dataset.explainitWidget = '1';
    document.head.appendChild(script);

    instance = explainit({
      chatId: 'chat-1',
      apiUrl: 'https://api.example.com',
      button: '#ask-ai',
    });

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => {
      expect(document.getElementById('explainit-widget-host')).toBeTruthy();
      expect(mount).toHaveBeenCalled();
    });

    expect(mount).toHaveBeenCalledWith(
      expect.any(ShadowRoot),
      expect.objectContaining({
        chatId: 'chat-1',
        apiUrl: 'https://api.example.com',
        theme: 'system',
      }),
    );
    expect(
      document
        .getElementById('explainit-widget-host')
        ?.classList.contains('is-open'),
    ).toBe(true);
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('toggles closed on second click', async () => {
    const unmount = vi.fn();
    window.ExplainitWidget = { mount: vi.fn(() => unmount) };
    const script = document.createElement('script');
    script.dataset.explainitWidget = '1';
    document.head.appendChild(script);

    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      apiUrl: 'https://api.example.com',
      button,
    });

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() =>
      expect(document.getElementById('explainit-widget-host')).toBeTruthy(),
    );

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(unmount).toHaveBeenCalled();
    expect(
      document
        .getElementById('explainit-widget-host')
        ?.classList.contains('is-open'),
    ).toBe(false);
  });

  it('destroy removes the widget host and leaves the Host control', async () => {
    window.ExplainitWidget = { mount: vi.fn(() => () => undefined) };
    const script = document.createElement('script');
    script.dataset.explainitWidget = '1';
    document.head.appendChild(script);

    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      apiUrl: 'https://api.example.com',
      button,
    });
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() =>
      expect(document.getElementById('explainit-widget-host')).toBeTruthy(),
    );

    instance?.destroy();
    instance = undefined;

    expect(document.getElementById('ask-ai')).toBe(button);
    expect(document.getElementById('explainit-widget-host')).toBeNull();
    expect(document.getElementById('explainit-launcher-style')).toBeNull();
  });

  it('passes the Host theme to the widget', async () => {
    const mount = vi.fn(() => () => undefined);
    window.ExplainitWidget = { mount };
    const script = document.createElement('script');
    script.dataset.explainitWidget = '1';
    document.head.appendChild(script);

    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      apiUrl: 'https://api.example.com',
      button,
      theme: 'light',
    });

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(mount).toHaveBeenCalled());

    expect(mount).toHaveBeenCalledWith(
      expect.any(ShadowRoot),
      expect.objectContaining({ theme: 'light' }),
    );
  });

  it('defaults an unknown theme to system', async () => {
    const mount = vi.fn(() => () => undefined);
    window.ExplainitWidget = { mount };
    const script = document.createElement('script');
    script.dataset.explainitWidget = '1';
    document.head.appendChild(script);

    const button = hostButton();
    instance = explainit({
      chatId: 'chat-1',
      apiUrl: 'https://api.example.com',
      button,
      theme: 'auto' as unknown as 'light',
    });

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(mount).toHaveBeenCalled());

    expect(mount).toHaveBeenCalledWith(
      expect.any(ShadowRoot),
      expect.objectContaining({ theme: 'system' }),
    );
  });
});
