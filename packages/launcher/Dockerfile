FROM --platform=linux/amd64 node:20-alpine

RUN apk add --no-cache aws-cli

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

CMD ["sh", "-c", "npm run build && aws s3 cp dist/launcher.js s3://${LAUNCHER_S3_BUCKET:-explainit-cdn}/launcher.js --endpoint-url ${AWS_ENDPOINT_URL} --content-type application/javascript --cache-control no-store"]
