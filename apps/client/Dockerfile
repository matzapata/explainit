FROM --platform=linux/amd64 node:20-alpine

# ARG only — do not ENV this, or `npm run dev` in Compose would bypass
# the Vite proxy and call localhost:4000 from the browser.
ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_LAUNCHER_SRC=http://localhost:4566/explainit-cdn/launcher.js

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

RUN VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_LAUNCHER_SRC=$VITE_LAUNCHER_SRC npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
