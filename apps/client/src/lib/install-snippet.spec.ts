import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateInstallSnippet,
  launcherSrc,
  publicApiUrl,
} from './install-snippet';

describe('generateInstallSnippet', () => {
  it('emits InstantSearch-style explainit() with apiUrl and no origin whitelist on the Host page', () => {
    const snippet = generateInstallSnippet({
      scriptSrc: 'https://cdn.example.com/launcher.js',
      chatId: 'chat-1',
      apiUrl: 'https://api.example.com',
    });

    expect(
      snippet,
    ).toBe(`<button type="button" id="explainit-ask-ai">Ask AI</button>
<script src="https://cdn.example.com/launcher.js"></script>
<script>
  explainit({
    chatId: "chat-1",
    apiUrl: "https://api.example.com",
    button: "#explainit-ask-ai",
    theme: "system",
  });
</script>`);
    expect(snippet).not.toContain('data-allowed-origin');
    expect(snippet).not.toContain('appUrl');
    expect(snippet).not.toContain('type="module"');
  });
});

describe('same-origin fallbacks', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults launcher and api URLs to the page origin when VITE_* are unset', () => {
    vi.stubEnv('VITE_LAUNCHER_SRC', '');
    vi.stubEnv('VITE_PUBLIC_API_URL', '');

    expect(launcherSrc()).toBe(`${window.location.origin}/cdn/launcher.js`);
    expect(publicApiUrl()).toBe(window.location.origin);
  });
});
