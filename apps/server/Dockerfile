FROM --platform=linux/amd64 node:18

# Install Google Chrome
RUN apt-get update
RUN apt-get install -y wget gnupg 
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg 
RUN sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' 
RUN apt-get update 
RUN apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 --no-install-recommends 
RUN service dbus start 
RUN rm -rf /var/lib/apt/lists/* 
RUN groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser

# install the app
WORKDIR /app

# copy package.json and package-lock.json for caching 
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

