# Launcher

Vanilla IIFE that Host sites load from a CDN. The dashboard Install snippet is:

```html
<button type="button" id="explainit-ask-ai">Ask AI</button>
<script src="https://cdn.example.com/launcher.js"></script>
<script>
  explainit({
    chatId: "CHAT_ID",
    appUrl: "https://app.example.com",
    button: "#explainit-ask-ai",
  });
</script>
```

`button` is a Host-owned element or a CSS selector for one. The Launcher does not create that control.

Website (`Chat.url`) is the whitelist. Nest enforces it with `frame-ancestors`. This script does not.

## Local

```bash
npm install
npm test
npm run build
```

Compose uploads `dist/launcher.js` to Floci (`http://localhost:4566/explainit-cdn/launcher.js`). A Host site demo lives in [`example/`](example/).

## Production (S3 + CloudFront)

GitHub Actions: workflow `Publish launcher` (`workflow_dispatch` or tag `launcher-v*`). It runs `npm test`, `npm run build`, then `aws s3 cp`. Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `LAUNCHER_S3_BUCKET`. Optional: `LAUNCHER_CLOUDFRONT_DISTRIBUTION_ID`, `LAUNCHER_S3_KEY` (default `launcher.js`).
