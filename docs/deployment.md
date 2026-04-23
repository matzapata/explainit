# Deployment

This page summarizes deployment expectations for production environments.

## Required services

- Application hosting for `client` and `server`
- Postgres instance with pgvector support
- External providers configured through server environment variables (for example email, storage, and model APIs)

## Deployment checklist

1. Provision a production Postgres database.
2. Configure all required environment variables for server and client.
3. Build and deploy the API service.
4. Build and deploy the web client.
5. Run database migrations before serving traffic.
6. Verify auth, ingestion, and chat flows in production.

## Notes

- Keep secrets in your platform secret manager, not in repo files.
- Use staged rollouts and smoke tests for safer releases.
