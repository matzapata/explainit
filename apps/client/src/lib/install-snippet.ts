export function launcherSrc(): string {
  const raw = import.meta.env.VITE_LAUNCHER_SRC;
  if (raw?.trim()) {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:4566/explainit-cdn/launcher.js';
}

/** Public API origin embedded in the Host Install snippet. */
export function publicApiUrl(): string {
  const raw = import.meta.env.VITE_PUBLIC_API_URL;
  if (raw?.trim()) {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:4000';
}

export function generateInstallSnippet(opts: {
  scriptSrc: string;
  chatId: string;
  apiUrl: string;
}): string {
  return `<button type="button" id="explainit-ask-ai">Ask AI</button>
<script src="${opts.scriptSrc}"></script>
<script>
  explainit({
    chatId: ${JSON.stringify(opts.chatId)},
    apiUrl: ${JSON.stringify(opts.apiUrl)},
    button: "#explainit-ask-ai",
    theme: "system",
  });
</script>`;
}
