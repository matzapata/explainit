import { describe, expect, it } from 'vitest';
import { generateInstallSnippet } from './install-snippet';

describe('generateInstallSnippet', () => {
  it('emits InstantSearch-style explainit() with no origin whitelist on the Host page', () => {
    const snippet = generateInstallSnippet({
      scriptSrc: 'https://cdn.example.com/launcher.js',
      chatId: 'chat-1',
      appUrl: 'https://app.example.com',
    });

    expect(snippet).toBe(`<button type="button" id="explainit-ask-ai">Ask AI</button>
<script src="https://cdn.example.com/launcher.js"></script>
<script>
  explainit({
    chatId: "chat-1",
    appUrl: "https://app.example.com",
    button: "#explainit-ask-ai",
  });
</script>`);
    expect(snippet).not.toContain('data-allowed-origin');
    expect(snippet).not.toContain('type="module"');
  });
});
