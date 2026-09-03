# Explainit client

Vite + React SPA for the Explainit admin and public chat UI. It talks to the NestJS API (`apps/server`).

## Scripts

- `npm run dev` — Vite dev server on port 3000
- `npm run build` — production build to `dist/`
- `npm run preview` — serve `dist/` on port 3000

## Environment

Copy `.env.example` to `.env.local`. `VITE_API_BASE_URL` is the browser-facing API origin. Auth mode is read from `GET /api/auth/mode` at runtime.
