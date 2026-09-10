FROM --platform=linux/amd64 node:20

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
COPY package-lock.json .

# Copy Prisma schema and migrations for generate / migrate deploy
COPY src/infra/database ./src/infra/database

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE $PORT

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/infra/main.js"]
