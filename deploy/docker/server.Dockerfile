# Production API + ingest worker (same image, different command).
# Build context: apps/server

FROM --platform=linux/amd64 node:20 AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY src/infra/database ./src/infra/database

RUN npm ci

COPY . .

RUN npm run build \
  && npm prune --omit=dev

FROM --platform=linux/amd64 node:20 AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub \
    | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    google-chrome-stable \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-khmeros \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    dbus \
    dbus-x11 \
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
