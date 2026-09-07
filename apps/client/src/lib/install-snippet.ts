export function launcherSrc(): string {
  const raw = import.meta.env.VITE_LAUNCHER_SRC;
  if (raw?.trim()) {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:4566/explainit-cdn/launcher.js';
}

export function generateInstallSnippet(opts: {
  scriptSrc: string;
  chatId: string;
  appUrl: string;
}): string {
  return `<button type="button" id="explainit-ask-ai">Ask AI</button>
<script src="${opts.scriptSrc}"></script>
<script>
  explainit({
    chatId: ${JSON.stringify(opts.chatId)},
    appUrl: ${JSON.stringify(opts.appUrl)},
    button: "#explainit-ask-ai",
  });
</script>`;
}
