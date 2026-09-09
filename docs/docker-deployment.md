# Deploying with Docker

Self-host Explainit on a single machine with Docker Compose. One public origin serves the Owner dashboard, visitor API, and Host launcher (`/cdn`).

Pre-built images: `ghcr.io/matzapata/explainit-server` and `ghcr.io/matzapata/explainit-client`. The same Compose file can also build from source with `--build`.

## Quick start

1. Copy the Compose stack (or clone the repo and use this directory):

```bash
cd deploy/compose
cp .env.example .env
```

2. Edit `.env`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PUBLIC_URL` | yes | Public origin (no trailing slash), e.g. `http://localhost` or `https://explainit.example.com` |
| `OPENROUTER_API_KEY` | yes | OpenRouter key for chat + embeddings |
| `HTTP_AUTH_USERNAME` / `HTTP_AUTH_PASSWORD` | recommended | Dashboard login. If either is empty, the dashboard is open (no sign-in). |
| `AUTH_SECRET` | recommended | JWT signing secret. Generate with `openssl rand -hex 32`. |

3. Start:

```bash
docker compose up -d
```

First run pulls (or builds) images, creates Postgres/Redis/MinIO volumes, runs migrations, and starts Caddy on port **80**.

4. Open `PUBLIC_URL`, sign in with the HTTP auth username/password, create a Chat, add Host origins, and copy the Install snippet.

Visitor Ask AI on Host sites calls the same origin (`apiUrl` in the snippet). Add each Host site origin in Chat Settings.

## What runs

| Service | Role |
| --- | --- |
| `caddy` | Port 80: `/api` + `/health` → API, `/explainit/*` → MinIO, everything else → dashboard + `/cdn` |
| `api` | Nest API (runs Prisma migrations on start) |
| `worker` | BullMQ ingest (Chromium scrape, `concurrency: 1`, `shm_size: 1gb`) |
| `client` | nginx SPA + `launcher.js` / `widget.js` / `widget.css` under `/cdn` |
| `postgres` | Postgres 16 + pgvector |
| `redis` | BullMQ + rate limits |
| `minio` | Object storage (text resources, path-style URLs at `{PUBLIC_URL}/explainit/...`) |

Root `docker-compose.yaml` remains the **local development** stack (bind mounts, Jaeger, Grafana, Floci). Do not use it for production.

## TLS

This Compose file serves plain HTTP on port 80 (like a simple Sessy `DISABLE_SSL` install).

Put TLS in front with Cloudflare, nginx, Caddy on the host, or a load balancer. Set `PUBLIC_URL` to the `https://` origin browsers actually use so CORS, the Install snippet, and citation URLs match.

## Auth

Set both `HTTP_AUTH_USERNAME` and `HTTP_AUTH_PASSWORD` for a locked dashboard. Visitor routes (`GET/POST /api/chats/:id`) stay public and are gated by each Chat’s `hostOrigins` allowlist.

Always set a long random `AUTH_SECRET` in production so rotating the password does not have to double as JWT rotation (when `AUTH_SECRET` is unset, the server derives a secret from the password).

## Backups

- **Postgres:** `docker compose exec postgres pg_dump -U explainit explainit > explainit-$(date +%F).sql`
- **MinIO:** back up the `minio_data` volume (or `mc mirror`).
- **Config:** keep a copy of `.env` somewhere safe (not in git).

Restore Postgres with `psql` into a fresh volume after `compose up` has created the schema, or restore before the API migrates — prefer dump/restore onto a stopped API/worker.

## Upgrades

```bash
cd deploy/compose
docker compose pull
docker compose up -d
```

The API container runs `prisma migrate deploy` on start. Watch `docker compose logs -f api worker` after upgrading.

To build from this checkout instead of GHCR:

```bash
docker compose up -d --build
```

## Operations notes

- **Ingest is serial.** The worker runs one Chromium job at a time. Large crawls take wall-clock time; give the VM enough RAM (2 GB+ recommended; 4 GB if you crawl often).
- **Shared memory.** The worker sets `shm_size: 1gb` for Chrome. Do not remove it.
- **Disk.** Postgres + MinIO volumes grow with resources and embeddings.
- **Health.** `GET /health` on the public origin should return `OK`.
- **Observability.** Tracing defaults to `http://127.0.0.1:4318` inside the container (no Jaeger in this stack). Point `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` at your collector if you have one.

## Troubleshooting

- **Dashboard open with no login:** set both `HTTP_AUTH_*` values and recreate the API/worker containers.
- **Widget / snippet points at the wrong host:** set `PUBLIC_URL` to the origin you open in the browser, then recreate `api` / `worker` (CORS + `S3_PUBLIC_ENDPOINT`). The client image uses same-origin fallbacks when built without `VITE_*`.
- **Host site cannot call the API:** add the Host page’s origin (scheme + host + port) under Chat Settings → Host origins.
- **Ingest stuck / Chrome crashes:** check worker logs and free memory; confirm `shm_size` is present on `worker`.
