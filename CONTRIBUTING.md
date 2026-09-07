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

- From repo root: `docker-compose up --build`
- Compose starts Postgres, Redis, Floci (S3), the API, the ingest worker, and the client.

## Common commands

- Backend tests: `cd apps/server && npm test`
- Backend lint: `cd apps/server && npm run lint`
- Frontend lint: `cd apps/client && npm run lint`
- Frontend tests: `cd apps/client && npm test`
- Host Chat tests: `cd packages/host-chat && npm test`

## Deployment basics

Use this as a lightweight release checklist for production-like environments.

1. Provision a Postgres database with pgvector support.
2. Provision Redis for BullMQ (`REDIS_HOST` / `REDIS_PORT`).
3. Configure all required environment variables for server and client.
4. Build and deploy the API (`node dist/infra/main`) and ingest worker (`node dist/infra/worker`).
5. Build and deploy the web client.
6. Run database migrations before serving traffic.
7. Verify auth, ingestion, and chat flows after deployment.

Keep secrets in your platform secret manager instead of repository files.

## Pull request guidelines

- Include a clear description of what changed and why.
- Add or update docs when behavior or workflows change.
- Run relevant lint and test commands before opening a pull request.
- Link related issues when applicable.

## Commit style

- Use descriptive commit messages.
- Prefer small, reviewable commits.

## Reporting bugs and requesting features

- Open an issue with steps to reproduce for bugs.
- For features, describe the problem, the proposed solution, and expected impact.
