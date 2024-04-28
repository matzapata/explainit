FROM --platform=linux/amd64 node:18-alpine

# List env variables required for building the app
ARG NEXT_PUBLIC_API_SERVER_BASE_URL
ARG NEXT_PUBLIC_API_CLIENT_BASE_URL
ARG NEXT_PUBLIC_LOOM_DEMO_URL

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


