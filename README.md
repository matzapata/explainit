
# Intro

Explainit. Create sharable chats with your documentation. Let developers get quickly what they want from you by creating powerful llm agents with your data. Upload some sources and get it up in minutes.

- Run dev with `docker-compose up --build`

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


