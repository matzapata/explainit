# Contributing

Thanks for your interest in contributing to Explainit.

## Before you start

- Read the project documentation in `docs/`.
- Review open issues and existing pull requests to avoid duplicate work.
- Follow the code of conduct in `CODE_OF_CONDUCT.md`.

## Development setup

1. Fork the repository and create a feature branch.
2. Create environment files:
   - `apps/server/.env.local`
   - `apps/client/.env.local`
3. Install dependencies
4. Keep changes focused and scoped to one concern.

## Run locally

Website ingest uses BullMQ (Redis). Run Redis on `localhost:6379` (or via Compose), then:

- API: `cd apps/server && npm run dev`
- Worker: `cd apps/server && npm run worker`
- Frontend: `cd apps/client && npm run dev`

The API enqueues website jobs; the worker process scrapes and embeds. Text ingest stays on the API.

## Run with Docker

**Local development** (bind mounts, Jaeger, Grafana, Floci):

- From repo root: `docker compose up --build`
- Compose starts Postgres, Redis, Floci (S3), the API, the ingest worker, and the client.

**Self-host / production-like:** use [`deploy/compose`](deploy/compose) and [docs/docker-deployment.md](docs/docker-deployment.md). Do not use the root Compose file for production.

## Common commands

- Backend tests: `cd apps/server && npm test`
- Lint/format: `make lint` / `make format` from the repo root
- Check (lint + format, no write): `make check` from the repo root
- Frontend tests: `cd apps/client && npm test`
- Host Chat tests: `cd packages/host-chat && npm test`
- Launcher tests: `cd packages/launcher && npm test`

Pull requests and pushes to `main` run these as GitHub Actions (`CI`): Biome (`biome ci`) plus package tests.

## Deployment

For self-hosting on a single VM, follow [docs/docker-deployment.md](docs/docker-deployment.md).

For a custom environment (without the Compose stack):

1. Provision a Postgres database with pgvector support.
2. Provision Redis for BullMQ (`REDIS_HOST` / `REDIS_PORT`).
3. Configure all required environment variables for server and client.
4. Build and deploy the API (`node dist/infra/main`) and ingest worker (`node dist/infra/main-worker`).
5. Build and deploy the web client (and host `launcher.js` / widget assets).
6. Run database migrations before serving traffic (API image does this on start).
7. Verify auth, ingestion, and chat flows after deployment.

Keep secrets in your platform secret manager instead of repository files.

## Pull request guidelines

- Include a clear description of what changed and why.
- Add or update docs when behavior or workflows change.
- Run relevant lint and test commands before opening a pull request (`make check` and the package `npm test` scripts).
- Link related issues when applicable.

## Commit style

- Use descriptive commit messages.
- Prefer small, reviewable commits.

## Reporting bugs and requesting features

- Open an issue with steps to reproduce for bugs.
- For features, describe the problem, the proposed solution, and expected impact.
