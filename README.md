
# Intro

Explainit. Create sharable chats with your documentation. Let developers get quickly what they want from you by creating powerful llm agents with your data. Upload some sources and get it up in minutes.

- Run dev with `docker-compose up --build`

# TODO

backend
TODO: - deployment
TODO: - rate limit on open endpoints https://docs.nestjs.com/security/rate-limiting#proxies (use this with chat id instead of ip)
TODO: - chat-controller test
TODO: - payments controller test
TODO: - create prisma version of pgvector
TODO: - cleanup unused deps

frontend
TODO: - connect back and front
TODO: - update texts

general
TODO: - buy domain
TODO: - set up vercel project with db
TODO: - test all flows

# Deployment

Setup env variables
- resend
- gcp storage
- openai
- postgress db with vercel
- domain


1. `cd client && npm run deploy`
2. `cd server && npm run deploy`

Setup pgvector extension in postgress db
1. Connect with psql
2. `CREATE EXTENSION IF NOT EXISTS vector;`


# Usage

1. Create postgres db
2. Update prisma schema and run first migration
3. Get resend and gcp storage credentials
4. Update payments plans
5. Configure kinde, add email to token with hasura mapping
6. Remove unused modules
