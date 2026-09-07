# Host site demo

Minimal fake docs page used to try the Launcher and Host Chat locally. Keep this origin separate from Floci (`:4566`) and the app (`:3000`) so it behaves like a real Host site.

## Prerequisites

1. Explainit stack running (`docker compose up`). Compose builds `launcher.js` and uploads it to Floci at http://localhost:4566/explainit-cdn/launcher.js. Client is http://localhost:3000.
2. In the app, set the Chat **Website** to your docs origin (or `http://localhost:8080` if you want this page to match Website). Local Docker also allows `localhost` Host pages so this demo can run while Website stays a production URL.
3. Add at least one resource and wait until it is ready.
4. **Publish** the Chat.
5. Put your Chat id into [`index.html`](index.html) (`explainit({ chatId, appUrl, button })`), or replace the scripts with the Install snippet from General / onboarding.

## Serve

Do not open the HTML as a `file://` URL. Host Chat only frames when Nest’s `frame-ancestors` allows this origin (Website, plus localhost in development).

```bash
npx --yes serve packages/launcher/example -p 8080
```

Or:

```bash
python3 -m http.server 8080 --directory packages/launcher/example
```

Open http://localhost:8080 — you should see the Host page’s **Ask AI** control in the corner.

## What to try

- Open Ask AI, ask a question grounded in your resources.
- Select text on this page, then ask about it.
- Close with X or Escape; the Host page should stay put.
- Open an unpublished Chat’s Host URL in a private window — it should be unavailable.
