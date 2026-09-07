# Host Chat lives in `packages/host-chat`

Ask AI UI is a React package (`@explainit/host-chat`), not part of the dashboard app or the Launcher. The dashboard Preview and `/chat/:id` page import `AskAiOverlay` / `ChatTranscript` from it. The CDN `widget.js` / `widget.css` are a Vite IIFE of the same package. `packages/launcher` stays a vanilla bootstrap that loads those artifacts on click.

## Considered options

- **Keep the widget entry in `apps/client`**: Preview reuse is real, but it makes the Owner app own a Host-site CDN artifact and copies dashboard favicons into the widget output.
- **Fold Host Chat into `packages/launcher`**: would mix a tiny vanilla Install script with React, Radix, and Tailwind, and would load that stack on every Host page instead of on click.
