FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --production

ENV NODE_ENV production

ENV PORT 4000
EXPOSE 4000

CMD ["node", "dist/main.js"]

