# Launcher

Vanilla IIFE that Host sites load from a CDN. The dashboard Install snippet is:

```html
<button type="button" id="explainit-ask-ai">Ask AI</button>
<script src="https://cdn.example.com/launcher.js"></script>
<script>
  explainit({
    chatId: "CHAT_ID",
    apiUrl: "https://api.example.com",
    button: "#explainit-ask-ai",
    theme: "system",
  });
</script>
```

`button` is a Host-owned element or a CSS selector for one. The Launcher does not create that control.

`theme` is `light`, `dark`, or `system` (default). `system` follows the visitor's `prefers-color-scheme`. Pass the Host site's appearance so Ask AI matches the page — do not rely on Host CSS leaking into the ShadowRoot.

On click, the Launcher mounts `widget.js` in a closed ShadowRoot on the Host page. The widget calls the visitor API at `apiUrl`. `Chat.hostOrigins` is the Origin whitelist enforced by Nest — not by this script.

## Local

```bash
npm install
npm test
npm run build
```

Compose uploads `dist/launcher.js` and `packages/host-chat` `dist/widget.{js,css}` to Floci (`http://localhost:4566/explainit-cdn/…`). A Host site demo lives in [`example/`](example/).

## Production (S3 + CloudFront)

GitHub Actions: workflow `Publish launcher` (`workflow_dispatch` or tag `launcher-v*`). It builds the launcher and Host Chat widget, then `aws s3 cp` for `launcher.js`, `widget.js`, and `widget.css`. Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `LAUNCHER_S3_BUCKET`. Optional: `LAUNCHER_CLOUDFRONT_DISTRIBUTION_ID`, `LAUNCHER_S3_KEY` (default `launcher.js`).
