FROM --platform=linux/amd64 node:20-alpine

# ARG only — do not ENV this, or `npm run dev` in Compose would bypass
# the Vite proxy and call localhost:4000 from the browser.
ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_LAUNCHER_SRC=http://localhost:4566/explainit-cdn/launcher.js
ARG VITE_PUBLIC_API_URL=http://localhost:4000

# Nest host-chat under /app so Vite resolves react from /app/node_modules.
COPY apps/client/package.json apps/client/package-lock.json /app/
WORKDIR /app

RUN npm install

COPY apps/client /app
COPY packages/host-chat /app/packages/host-chat

RUN VITE_API_BASE_URL=$VITE_API_BASE_URL \
  VITE_LAUNCHER_SRC=$VITE_LAUNCHER_SRC \
  VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL \
  npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
