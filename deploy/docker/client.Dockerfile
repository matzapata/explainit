# Production dashboard SPA + launcher CDN assets under /cdn.
# Build context: repository root

FROM --platform=linux/amd64 node:20-alpine AS launcher

WORKDIR /app
COPY packages/launcher/package.json packages/launcher/package-lock.json ./
RUN npm ci
COPY packages/launcher ./
RUN npm run build

FROM --platform=linux/amd64 node:20-alpine AS widget

WORKDIR /app
COPY packages/host-chat/package.json packages/host-chat/package-lock.json ./
RUN npm ci
COPY packages/host-chat ./
RUN npm run build

FROM --platform=linux/amd64 node:20-alpine AS client

WORKDIR /app
COPY apps/client/package.json apps/client/package-lock.json ./
RUN npm ci
COPY apps/client ./
COPY packages/host-chat /app/packages/host-chat

# Empty = same-origin at runtime (see install-snippet.ts / auth config).
ENV VITE_API_BASE_URL=
ENV VITE_PUBLIC_API_URL=
ENV VITE_LAUNCHER_SRC=

RUN npm run build

FROM --platform=linux/amd64 nginx:1.27-alpine

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=client /app/dist /usr/share/nginx/html
COPY --from=launcher /app/dist/launcher.js /usr/share/nginx/html/cdn/launcher.js
COPY --from=widget /app/dist/widget.js /usr/share/nginx/html/cdn/widget.js
COPY --from=widget /app/dist/widget.css /usr/share/nginx/html/cdn/widget.css

EXPOSE 80
