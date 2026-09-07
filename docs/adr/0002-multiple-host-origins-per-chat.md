# Multiple exact Host origins per Chat

Visitor routes allow `Origin` when it matches any entry in `Chat.hostOrigins`. The Install snippet stays identical across sites. Exact origin match only — no subdomain wildcards. Host origins are allowlist-only (not crawl targets); knowledge comes from `ChatResource`.

## Considered options

- **Separate Website (`Chat.url`) plus extras**: dropped; a single `hostOrigins` list is enough for allowlisting and avoids dual fields.
- **Subdomain wildcards (`*.demo.com`)**: different security tradeoff; deferred.
