# Host Chat

Default Ask AI UI for Visitors. The dashboard Preview and `/chat/:id` page import `AskAiOverlay` / `ChatTranscript` from this package. The CDN widget build (`widget.js` + `widget.css`) is the same UI mounted into a Host-page ShadowRoot by the Launcher.

This package is the React Ask AI implementation. `packages/launcher` stays a vanilla IIFE that loads these artifacts on click.

## Local

```bash
npm install
npm test
npm run build
```

Compose uploads `dist/widget.js` and `dist/widget.css` next to `launcher.js` on Floci (`http://localhost:4566/explainit-cdn/…`).

## Production (S3 + CloudFront)

GitHub Actions: workflow `Publish launcher` builds the launcher and this package, then uploads `launcher.js`, `widget.js`, and `widget.css`.
