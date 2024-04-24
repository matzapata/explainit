FROM --platform=linux/amd64 node:18-alpine

# List env variables required for building the app
ENV NEXT_PUBLIC_API_SERVER_BASE_URL https://explainit-server.mangomoss-5f6a23a4.centralus.azurecontainerapps.io
ENV NEXT_PUBLIC_API_CLIENT_BASE_URL https://explainit-server.mangomoss-5f6a23a4.centralus.azurecontainerapps.io
ENV NEXT_PUBLIC_LOOM_DEMO_URL https://www.loom.com/embed/4f5aac7836f44e27a3cdd1854b566d46?sid=91111162-98fc-4d0d-99ae-3c3135a4979f

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