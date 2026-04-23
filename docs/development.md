# Development

This guide covers local setup for contributors.

## Prerequisites

- Node.js 18+
- npm
- Docker (optional, for full-stack local orchestration)

## Setup

1. Create environment files:
   - `server/.env.development`
   - `client/.env.local`
2. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`

## Run locally

- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`

## Run with Docker

- From repo root: `docker-compose up --build`

## Common commands

- Backend tests: `cd server && npm test`
- Backend lint: `cd server && npm run lint`
- Frontend lint: `cd client && npm run lint`
