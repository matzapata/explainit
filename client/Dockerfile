FROM node:18-alpine

ARG NEXT_PUBLIC_API_SERVER_BASE_URL

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

ENV NODE_ENV production

EXPOSE $PORT

CMD ["npm", "run", "start"]