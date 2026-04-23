# Contributing

Thanks for your interest in contributing to Explainit.

## Before you start

- Read the project documentation in `docs/`.
- Review open issues and existing pull requests to avoid duplicate work.
- Follow the code of conduct in `CODE_OF_CONDUCT.md`.

## Development setup

1. Fork the repository and create a feature branch.
2. Create environment files:
   - `server/.env.local`
   - `client/.env.local`
3. Install dependencies
4. Keep changes focused and scoped to one concern.

## Run locally

- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`

## Run with Docker

- From repo root: `docker-compose up --build`

## Common commands

- Backend tests: `cd server && npm test`
- Backend lint: `cd server && npm run lint`
- Frontend lint: `cd client && npm run lint`

## Deployment basics

Use this as a lightweight release checklist for production-like environments.

1. Provision a Postgres database with pgvector support.
2. Configure all required environment variables for server and client.
3. Build and deploy the API service.
4. Build and deploy the web client.
5. Run database migrations before serving traffic.
6. Verify auth, ingestion, and chat flows after deployment.

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
