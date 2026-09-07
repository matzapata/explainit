# Host site example

Minimal fake docs page used to try the Launcher and Host widget locally. Keep this origin separate from Floci (`:4566`) and the app (`:3000`) so it behaves like a real Host site.

## Run

1. Explainit stack running (`docker compose up`). Compose builds `launcher.js` and `widget.js`/`widget.css` and uploads them to Floci at http://localhost:4566/explainit-cdn/. Client is http://localhost:3000; API is http://localhost:4000.
2. From the repo root (or this folder):

   ```bash
   npx --yes serve packages/launcher/example -p 8080
   ```

3. Open http://localhost:8080.
4. In the dashboard, set Website to `http://localhost:8080` (or any URL on that origin) and publish the Chat. In development, Nest also allows any `localhost` / `127.0.0.1` Origin.
5. Put your Chat id into [`index.html`](index.html) (`explainit({ chatId, apiUrl, button })`), or replace the scripts with the Install snippet from General / onboarding.

`apiUrl` must be the Nest API (`http://localhost:4000`), not the Vite dashboard.

Do not open the HTML as a `file://` URL. Visitor requests need a real browser Origin.
