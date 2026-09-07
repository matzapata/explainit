# Host widget on the customer page with Origin-allowlisted visitor API

We embed Ask AI as a CDN launcher + Shadow DOM widget that runs on the Host site and calls Nest’s JSON visitor routes (`GET/POST /api/chats/:id`). Host origins (`Chat.hostOrigins`) are enforced server-side from the request `Origin` (fallback `Referer`); Nest does not serve Host Chat HTML or use CSP `frame-ancestors` for this product surface. Custom UIs use the same API. Conversation continuity uses an optional client-held `conversationId` (localStorage in the default widget), not a cross-site cookie.

## Considered options

- **Nest iframe document + `frame-ancestors`** (previous): isolates Explainit CSS/cookies, but makes Nest serve UI and blocks bring-your-own clients.
- **Public search-only API key** (Algolia-style): deferred; Origin allowlisting is enough for the first pass.
