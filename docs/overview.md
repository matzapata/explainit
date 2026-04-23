# Overview

Explainit is a documentation-first AI chat platform. It helps teams publish chat experiences that answer questions using their own docs and content sources.

## What it solves

- Reduces time spent searching through long documentation pages
- Gives developers a conversational way to discover product knowledge
- Provides a reusable base for internal support bots or public docs assistants

## Core components

- `client`: Next.js web app for chat, management, and onboarding flows
- `server`: NestJS API for ingestion, retrieval, orchestration, and integrations
- `postgres`: pgvector-enabled database used for persistent storage and search

## Typical flow

1. Add a documentation source.
2. Ingest and process content.
3. Ask questions through the chat interface.
4. Share and embed chat experiences where needed.
