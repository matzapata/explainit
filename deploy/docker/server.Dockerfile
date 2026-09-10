# Production API + ingest worker (same image, different command).
# Build context: apps/server

FROM --platform=linux/amd64 node:20-bookworm-slim AS build

ENV PUPPETEER_SKIP_DOWNLOAD=true

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

# Chrome's apt repo often hash-mismatches (CDN lag). Install the .deb instead.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    wget \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-khmeros \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    dbus \
    dbus-x11 \
  && wget -q -O /tmp/google-chrome-stable_current_amd64.deb \
    https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
  && apt-get install -y --no-install-recommends /tmp/google-chrome-stable_current_amd64.deb \
  && rm -f /tmp/google-chrome-stable_current_amd64.deb \
    /etc/apt/sources.list.d/google-chrome.list \
    /etc/apt/sources.list.d/google.list \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -r pptruser \
  && useradd -rm -g pptruser -G audio,video pptruser

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/infra/database ./src/infra/database

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PORT=4000

EXPOSE 4000

# API runs migrations then serves. Worker overrides command (no migrate).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/infra/main.js"]
