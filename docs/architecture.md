# Architecture

Explainit uses a standard web + API + database architecture designed for local development and cloud deployment.

## High-level design

- Frontend (`client`): Next.js app for user interface and chat interaction
- Backend (`server`): NestJS API that manages ingestion, chat logic, and integrations
- Database (`postgres`): pgvector-enabled Postgres for structured data and vector search

## Data and request flow

1. The client sends chat and management requests to the server API.
2. The server validates auth and request context.
3. For chat, the server retrieves relevant document chunks from storage and vector search.
4. The server returns a grounded response payload to the client.

## Diagrams

- Product and UX sketch: `docs/architecture/update.drawio`

Use the draw.io file for visual context when discussing major UX or flow changes.
