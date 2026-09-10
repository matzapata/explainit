# Production API + ingest worker (same image, different command).
# Build context: apps/server

FROM --platform=linux/amd64 node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY src/infra/database ./src/infra/database

RUN npm ci

COPY . .

RUN npm run build \
  && npm prune --omit=dev

FROM --platform=linux/amd64 node:20-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/infra/database ./src/infra/database

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# API runs migrations then serves. Worker overrides command (no migrate).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/infra/main.js"]
